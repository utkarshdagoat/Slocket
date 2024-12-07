use core::hash;
use std::{
    collections::HashMap,
    error::Error,
    fs::{self, File, OpenOptions},
    hash::{DefaultHasher, Hash, Hasher},
    io::{Read, Write},
    path::Path, time::{SystemTime, UNIX_EPOCH},
};
mod types;
mod utils;
use utils::copy_dir_recursively;
pub mod compile;
use crate::types::PrimitiveSolidityType;
#[derive(Clone, Debug)]
pub enum Visbility {
    Public,
    Private,
    Immutable,
}

#[derive(Clone, Debug)]
pub struct ContractGenerator {
    global_states: HashMap<String, PrimitiveSolidityType>,
    gloabl_visibilities: HashMap<String, Visbility>,
    local_state: HashMap<String, PrimitiveSolidityType>,
    lambda_func_inputs: HashMap<String, PrimitiveSolidityType>,
}

impl Default for ContractGenerator {
    fn default() -> Self {
        let mut local_state = HashMap::new();
        local_state.insert("msg.sender".to_string(), PrimitiveSolidityType::Address);
        local_state.insert("msg.value".to_string(), PrimitiveSolidityType::Uint(256));
        local_state.insert("msg.data".to_string(), PrimitiveSolidityType::Bytes);
        Self {
            global_states: HashMap::new(),
            local_state,
            lambda_func_inputs: HashMap::new(),
            gloabl_visibilities: HashMap::new(),
        }
    }
}

impl ContractGenerator {
    pub fn process_lambda(&mut self, function: String) -> Result<(), Box<dyn Error>> {
        for line in function.lines() {
            let line = line.split("//").next().unwrap().trim();
            if line.is_empty() || line.starts_with("//") {
                continue;
            }

            if is_lambda(line) {
                self.process_lambda_declaration(line)?;
                continue;
            }

            if line.contains("=") {
                self.process_assignment(line)?;
            }
        }
        Ok(())
    }

    fn process_lambda_declaration(&mut self, line: &str) -> Result<(), Box<dyn Error>> {
        let func_args = PrimitiveSolidityType::parse_function_declaration(line);
        self.lambda_func_inputs = func_args;
        Ok(())
    }

    fn process_assignment(&mut self, line: &str) -> Result<(), Box<dyn Error>> {
        let words: Vec<&str> = line.split_whitespace().collect();

        // Check if this is a new variable declaration
        if let Some(primitive_type) = PrimitiveSolidityType::from_string(words[0]) {
            if words.len() < 2 {
                return Err("Invalid variable declaration".into());
            }
            let name = words[1].trim_end_matches(';').to_string();
            self.local_state.insert(name, primitive_type);
            return Ok(());
        }

        // Handle existing variable assignment
        let (var_name, var_type) = self.parse_assignment(line)?;
        self.global_states.insert(var_name, var_type);

        Ok(())
    }

    fn parse_assignment(
        &self,
        line: &str,
    ) -> Result<(String, PrimitiveSolidityType), Box<dyn Error>> {
        let parts: Vec<&str> = line.split('=').collect();
        if parts.len() != 2 {
            return Err("Invalid assignment".into());
        }

        let left_side = parts[0].trim();
        let right_side = parts[1].trim().trim_end_matches(';');

        // Handle mapping assignment: map[key] = value
        if let Some((base_name, key_str)) = extract_mapping_parts(left_side) {
            if key_str.len() > 1 || key_str.is_empty() {
                return Ok((base_name.to_string(), PrimitiveSolidityType::Nested));
            }
            let key_type = self.infer_type_from_value(key_str[0])?;
            let value_type = self.infer_type_from_value(right_side)?;

            return Ok((
                base_name.to_string(),
                PrimitiveSolidityType::Mapping {
                    key: Box::new(key_type),
                    value: Box::new(value_type),
                },
            ));
        }

        // Handle array access or array assignment
        if let Some((base_name, index)) = extract_array_parts(left_side) {
            let element_type = if let Some(var_type) = self.get_variable_type(right_side) {
                var_type
            } else {
                self.infer_type_from_value(right_side)?
            };

            // If index is numeric and <= 32, create static array
            if let Ok(size) = index.parse::<usize>() {
                if size <= 32 {
                    return Ok((
                        base_name.to_string(),
                        PrimitiveSolidityType::Array(Box::new(element_type), size),
                    ));
                }
            }
            return Ok((
                base_name.to_string(),
                PrimitiveSolidityType::DynamicArray(Box::new(element_type)),
            ));
        }

        // Handle simple assignment
        let assigned_type = if let Some(var_type) = self.get_variable_type(right_side) {
            var_type
        } else {
            self.infer_type_from_value(right_side)?
        };
        Ok((left_side.to_string(), assigned_type))
    }

    fn get_variable_type(&self, var_name: &str) -> Option<PrimitiveSolidityType> {
        self.local_state
            .get(var_name)
            .or_else(|| self.lambda_func_inputs.get(var_name))
            .or_else(|| self.global_states.get(var_name))
            .cloned()
    }

    fn infer_type_from_value(&self, value: &str) -> Result<PrimitiveSolidityType, Box<dyn Error>> {
        // Boolean values
        if value == "true" || value == "false" {
            return Ok(PrimitiveSolidityType::Bool);
        }

        // Address values
        if value.starts_with("0x") && value.len() == 42 {
            return Ok(PrimitiveSolidityType::Address);
        }

        // String values
        if value.starts_with("\"") && value.ends_with("\"") {
            return Ok(PrimitiveSolidityType::String);
        }

        // Bytes values
        if value.starts_with("0x") {
            let byte_length = (value.len() - 2) / 2;
            if byte_length <= 32 {
                return Ok(PrimitiveSolidityType::FixedBytes(byte_length as u8));
            }
            return Ok(PrimitiveSolidityType::Bytes);
        }

        // Array literals
        if value.starts_with('[') && value.ends_with(']') {
            let inner = value[1..value.len() - 1].trim();
            if let Some(first_element) = inner.split(',').next() {
                let element_type = self.infer_type_from_value(first_element.trim())?;
                let size = inner.split(',').count();
                if size <= 32 {
                    return Ok(PrimitiveSolidityType::Array(Box::new(element_type), size));
                } else {
                    return Ok(PrimitiveSolidityType::DynamicArray(Box::new(element_type)));
                }
            }
        }

        // Numeric values
        if let Ok(num) = value.parse::<i64>() {
            if num < 0 {
                return Ok(PrimitiveSolidityType::Int(256));
            }
            return Ok(PrimitiveSolidityType::Uint(256));
        }

        return Ok(self.get_variable_type(value).unwrap());
    }

    pub fn write_lambda(
        &self,
        function: String,
        lambda_name: String,
    ) -> Result<(String, String), Box<dyn Error>> {
        // Generate timestamp
        let timestamp = SystemTime::now()
            .duration_since(UNIX_EPOCH)?
            .as_secs();
        
        // Create hash from lambda name and timestamp
        let mut hasher = DefaultHasher::new();
        lambda_name.hash(&mut hasher);
        timestamp.hash(&mut hasher);
        let hash = hasher.finish();
        
        // Create unique filename with timestamp
        let filename = format!("lambda_{}_{}", timestamp, hash);
        let final_path = format!("output/{}", filename);
        
        // Copy template and process file
        copy_dir_recursively(Path::new("template"), Path::new(&final_path))?;
        let file_path = lambda_file(&final_path);
        let mut file = File::open(file_path.clone())?;
        let mut content = String::new();
        file.read_to_string(&mut content)?;
        
        // Replace placeholders
        let comment = "//lambda_here";
        let new_content = content.replace(comment, &function);
        let state_comment = "//states_here";
        let state_content = self.global_state_string();
        let new_content = new_content.replace(state_comment, &state_content);
        
        // Write to file
        fs::write(&file_path, new_content)?;
        
        // Return both state content and filename
        Ok((state_content, filename))
    }

    pub fn write_apg(&self, dir: String) -> Result<(), Box<dyn Error>> {
        let final_path = format!("output/{}", dir);
        println!("final_path: {:?}", final_path);
        let file_path = lambda_apg_file(&final_path);
        let mut file = File::open(file_path.clone())?;
        let mut content = String::new();
        file.read_to_string(&mut content)?;
        let comment = "//lambda_here";

        let new_content = content.replace(comment, &self.lambda_apg_content());

        fs::write(file_path, new_content)?;
        Ok(())
    }

    pub fn global_state_string(&self) -> String {
        let mut state = String::new();
        for (var_name, var_type) in &self.global_states {
            let visibility = match self.gloabl_visibilities.get(var_name) {
                Some(Visbility::Public) => "public",
                Some(Visbility::Private) => "private",
                Some(Visbility::Immutable) => "immutable",
                None => "public",
            };
            self.gloabl_visibilities.get(var_name);
            state.push_str(&format!(
                "{} {} {};\n",
                var_type.to_string(),
                visibility,
                var_name
            ));
        }
        state
    }

    pub fn set_visibility(&mut self, variable: &str, visibility: Visbility) {
        self.gloabl_visibilities
            .insert(variable.to_string(), visibility);
    }

    fn lambda_apg_content(&self) -> String {
        let function_arguments = self
            .lambda_func_inputs
            .iter()
            .map(|(name, var_type)| format!("{} {}", var_type.to_string(), name))
            .collect::<Vec<String>>()
            .join(", ");

        let variable_names = self
            .lambda_func_inputs
            .iter()
            .map(|(name, _)| name.to_string())
            .collect::<Vec<String>>()
            .join(", ");
        let function_arguments = if function_arguments.is_empty() {
            "".to_string()
        } else {
            format!(", {}", function_arguments)
        };
        let content = format!(
            "function callLambda( 
            address lambdaAddress
            {} 
        ) public preExecutionChecks async {{ 
            Lambda lambda = Lambda(lambdaAddress); 
            lambda.lambda({}); 
        }}",
            function_arguments, variable_names
        );
        content
    }

    pub fn clear(&mut self) {
        self.global_states.clear();
        self.gloabl_visibilities.clear();
        self.local_state.clear();
        self.lambda_func_inputs.clear();
    }
}

fn lambda_file(dir: &str) -> String {
    format!("{}/{}", dir, "src/Lambda.sol")
}
fn lambda_apg_file(dir: &str) -> String {
    format!("{}/{}", dir, "src/LambdaAppGateway.sol")
}

fn lambda_test_file(dir: &str) -> String {
    format!("{}/{}", dir, "test/LambdaTest.sol")
}

fn is_lambda(line: &str) -> bool {
    let words: Vec<&str> = line.split_whitespace().collect();
    if words.len() < 2 {
        return false;
    }
    let val = words[1].split('(').next().unwrap();
    words.len() >= 2 && words[0] == "function" && val == "lambda"
}

fn extract_mapping_parts(expr: &str) -> Option<(&str, Vec<&str>)> {
    if let Some(first_bracket_start) = expr.find('[') {
        if let Some(last_bracket_end) = expr.rfind(']') {
            let base_name = expr[..first_bracket_start].trim();
            let key = expr[first_bracket_start + 1..last_bracket_end].trim();
            let keys = key.split("][").collect::<Vec<&str>>();
            return Some((base_name, keys));
        }
    }
    None
}

fn extract_array_parts(expr: &str) -> Option<(&str, &str)> {
    if let Some(bracket_start) = expr.find('[') {
        if let Some(bracket_end) = expr.find(']') {
            let base_name = expr[..bracket_start].trim();
            let index = expr[bracket_start + 1..bracket_end].trim();
            return Some((base_name, index));
        }
    }
    None
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_variable_mapping_assignment() -> Result<(), Box<dyn Error>> {
        let mut generator = ContractGenerator::default();

        let function = r#"
            function test(){
                uint256[] memory values;
                values[0] = 100;
                values[1] = 200;
                values[2] = 300; 
            }


            function lambda(address user, uint256 tokenId) returns (bool) {
                // Local variable declarations
                address delegate = 0x742d35Cc6634C0532925a3b844Bc454e4438f44e;
                uint256 amount = 100;

                // Mapping assignments using variables
                balances[user] = amount;          // mapping(address => uint256)
                approvals[delegate] = true;       // mapping(address => bool)
                owners[tokenId] = user;           // mapping(uint256 => address)

                // Array assignments
                uint256[] memory values;
                values[0] = amount;               // uint256[]

                return true;
            }
        "#
        .to_string();

        generator.process_lambda(function)?;

        println!("{:?}", generator.lambda_apg_content());

        // Check mapping types
        if let Some(PrimitiveSolidityType::Mapping { key, value }) =
            generator.global_states.get("balances")
        {
            assert!(matches!(**key, PrimitiveSolidityType::Address));
            assert!(matches!(**value, PrimitiveSolidityType::Uint(256)));
        }

        if let Some(PrimitiveSolidityType::Mapping { key, value }) =
            generator.global_states.get("approvals")
        {
            assert!(matches!(**key, PrimitiveSolidityType::Address));
            assert!(matches!(**value, PrimitiveSolidityType::Bool));
        }

        if let Some(PrimitiveSolidityType::Mapping { key, value }) =
            generator.global_states.get("owners")
        {
            assert!(matches!(**key, PrimitiveSolidityType::Uint(256)));
            assert!(matches!(**value, PrimitiveSolidityType::Address));
        }

        Ok(())
    }

    #[test]
    fn test_nested_mappings() -> Result<(), Box<dyn Error>> {
        let mut generator = ContractGenerator::default();

        let function = r#"
            function lambda(address owner, address spender) returns (bool) {
                allowances[owner][spender] = true;    // mapping(address => mapping(address => bool))
                return true;
            }
        "#.to_string();

        generator.process_lambda(function)?;

        assert_eq!(
            &PrimitiveSolidityType::Nested,
            generator.global_states.get("allowances").unwrap()
        );

        Ok(())
    }

    #[test]
    fn test_file_write() {
        let mut generator = ContractGenerator::default();

        let function = r#"
            function test(){
                uint256[] memory values;
                values[0] = 100;
                values[1] = 200;
                values[2] = 300; 
            }


            function lambda(address user, uint256 tokenId) returns (bool) {
                // Local variable declarations
                address delegate = 0x742d35Cc6634C0532925a3b844Bc454e4438f44e;
                uint256 amount = 100;

                // Mapping assignments using variables
                balances[user] = amount;          // mapping(address => uint256)
                approvals[delegate] = true;       // mapping(address => bool)
                owners[tokenId] = user;           // mapping(uint256 => address)

                // Array assignments
                uint256[] memory values;
                values[0] = amount;               // uint256[]

                return true;
            }
        "#
        .to_string();

        generator.process_lambda(function.clone()).unwrap();
        generator
            .write_lambda(function, "test_lambda".to_string())
            .unwrap();
        generator.write_apg("test_lambda".to_string()).unwrap();
    }
}
