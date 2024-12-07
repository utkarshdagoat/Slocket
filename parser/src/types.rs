use std::{collections::HashMap, str::FromStr};

#[derive(Clone, Debug, PartialEq, Eq)]
pub enum PrimitiveSolidityType {
    Bool,

    String,
    Bytes,
    FixedBytes(u8), //bytes1 to bytes32

    Int(u16),
    Uint(u16),
    Address,
    AddressPayable,

    Array(Box<PrimitiveSolidityType>, usize), //static array
    DynamicArray(Box<PrimitiveSolidityType>),

    Mapping {
        key: Box<PrimitiveSolidityType>,
        value: Box<PrimitiveSolidityType>,
    },
    Nested
}

impl ToString for PrimitiveSolidityType {
    fn to_string(&self) -> String {
        match self {
            PrimitiveSolidityType::Bool => "bool".to_string(),
            PrimitiveSolidityType::Address => "address".to_string(),
            PrimitiveSolidityType::AddressPayable => "address payable".to_string(),
            PrimitiveSolidityType::Int(bits) => format!("int{}", bits),
            PrimitiveSolidityType::Uint(bits) => format!("uint{}", bits),
            PrimitiveSolidityType::Array(inner_type, size) => {
                format!("{}[{}]", inner_type.to_string(), size)
            }
            PrimitiveSolidityType::DynamicArray(inner_type) => {
                format!("{}[]", inner_type.to_string())
            }
            PrimitiveSolidityType::Mapping { key, value } => {
                format!("mapping({}=>{})", key.to_string(), value.to_string())
            }
            PrimitiveSolidityType::String => "string".to_string(),
            PrimitiveSolidityType::Bytes => "bytes".to_string(),
            PrimitiveSolidityType::FixedBytes(size) => format!("bytes{}", size),
            Self::Nested => "".to_string(),
        }
    }
}

impl PrimitiveSolidityType {
    pub fn from_string(string: &str) -> Option<Self> {
        let string = string.trim();

        //handling the basic types first
        match string {
            "bool" => return Some(PrimitiveSolidityType::Bool),
            "string" => return Some(PrimitiveSolidityType::String),
            "bytes" => return Some(PrimitiveSolidityType::Bytes),
            "address" => return Some(PrimitiveSolidityType::Address),
            "address payable" => return Some(PrimitiveSolidityType::AddressPayable),
            _ => {}
        }

        // Handle uint<N> and int<N>
        if string.starts_with("uint") {
            if let Ok(bits) = string[4..].parse::<u16>() {
                return Some(PrimitiveSolidityType::Uint(bits));
            }
        }
        if string.starts_with("int") {
            if let Ok(bits) = string[3..].parse::<u16>() {
                return Some(PrimitiveSolidityType::Int(bits));
            }
        }

        // handling dynamic bytes
        if string.starts_with("bytes") && string.len() > 5 {
            if let Ok(size) = string[5..].parse::<u8>() {
                if size <= 32 {
                    return Some(PrimitiveSolidityType::FixedBytes(size));
                }
            }
        }

        // Handle arrays
        if let Some(bracket_idx) = string.find('[') {
            let base_type = string[..bracket_idx].to_string();
            let array_spec = &string[bracket_idx..];

            let base_type = match PrimitiveSolidityType::from_string(&base_type) {
                Some(ty) => ty,
                None => {
                    return None;
                }
            };

            // Check if it's a dynamic array
            if array_spec == "[]" {
                return Some(PrimitiveSolidityType::DynamicArray(Box::new(base_type)));
            }

            // Handle fixed-size arrays
            if array_spec.starts_with('[') && array_spec.ends_with(']') {
                if let Ok(size) = array_spec[1..array_spec.len() - 1].parse::<usize>() {
                    return Some(PrimitiveSolidityType::Array(Box::new(base_type), size));
                }
            }
        }

        // Handle mappings
        if string.starts_with("mapping(") && string.ends_with(')') {
            let inner = &string[8..string.len() - 1];
            if let Some(separator_idx) = inner.find("=>") {
                let key_type = inner[..separator_idx].trim();
                let value_type = inner[separator_idx + 2..].trim();
                return Some(PrimitiveSolidityType::Mapping {
                    key: Box::new(PrimitiveSolidityType::from_string(key_type).unwrap()),
                    value: Box::new(PrimitiveSolidityType::from_string(value_type).unwrap()),
                });
            }
        }
        None
    }

    pub fn parse_function_declaration(function_declaration: &str) -> HashMap<String, Self> {
        let mut input_args = HashMap::new();

        let bracket_indx = function_declaration.find('(').unwrap();
        let closing_indx = function_declaration.find(')').unwrap();

        let input_args_string = &function_declaration[(bracket_indx + 1)..closing_indx];
        for words in input_args_string.split(',') {
            let word: Vec<&str> = words.split(' ').filter(|&word| word != "").collect();
            let arg_type = PrimitiveSolidityType::from_string(word[0]).unwrap();
            input_args.insert(word[1].to_string(), arg_type);
        }

        input_args
    }

    pub fn from_assignment(assignment: &str) -> Self {
        let assignment = assignment.trim();

        // Split into left side and value
        let parts: Vec<&str> = assignment.split('=').collect();
        if parts.len() != 2 {
            panic!("Invalid assignment: {}", assignment);
        }

        let left_side = parts[0].trim();
        let value = parts[1].trim();

        // Handle mapping assignments like map[key]=value
        if left_side.contains('[') && left_side.contains(']') {
            let map_name = left_side.split('[').next().unwrap();
            // Extract key type from the brackets
            let key_start = left_side.find('[').unwrap() + 1;
            let key_end = left_side.find(']').unwrap();
            let key_value = &left_side[key_start..key_end];

            return PrimitiveSolidityType::Mapping {
                key: Box::new(Self::infer_type_from_value(key_value)),
                value: Box::new(Self::infer_type_from_value(value)),
            };
        }

        // Handle array assignments like arr[0]=value
        if left_side.ends_with(']') {
            let base_type = Self::infer_type_from_value(value);
            if left_side.ends_with("[]") {
                return PrimitiveSolidityType::DynamicArray(Box::new(base_type));
            } else {
                // Extract size from fixed array
                let size_start = left_side.rfind('[').unwrap() + 1;
                let size_end = left_side.len() - 1;
                if let Ok(size) = left_side[size_start..size_end].parse::<usize>() {
                    return PrimitiveSolidityType::Array(Box::new(base_type), size);
                }
            }
        }

        // For simple assignments, infer from the value
        Self::infer_type_from_value(value)
    }

    fn infer_type_from_value(value: &str) -> Self {
        let value = value.trim();

        // Handle boolean values
        if value == "true" || value == "false" {
            return PrimitiveSolidityType::Bool;
        }

        // Handle address values
        if value.starts_with("0x") && value.len() == 42 {
            return PrimitiveSolidityType::Address;
        }

        // Handle string values
        if value.starts_with("\"") && value.ends_with("\"") {
            return PrimitiveSolidityType::String;
        }

        // Handle hex values
        if value.starts_with("0x") {
            let byte_length = (value.len() - 2) / 2;
            if byte_length <= 32 {
                return PrimitiveSolidityType::FixedBytes(byte_length as u8);
            }
            return PrimitiveSolidityType::Bytes;
        }

        // Handle numeric values
        if let Ok(num) = value.parse::<i64>() {
            if num < 0 {
                return PrimitiveSolidityType::Int(256);
            }
            return PrimitiveSolidityType::Uint(256);
        }

        // Default to string for unknown values
        PrimitiveSolidityType::String
    }
}

#[test]
fn test_parse_function_declaration() {
    let function_dec = "function lambda(uint256 param1,bytes32 param2)";
    let res = PrimitiveSolidityType::parse_function_declaration(function_dec);
}
