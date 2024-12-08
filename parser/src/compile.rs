use serde_json::Value;
use std::fs::File;
use std::io::Read;
use std::process::Command;
use std::{env, fs};

pub fn get_contract_bytecode(
    dirname: String,
) -> Result<(String, Value, String, Value), Box<dyn std::error::Error>> {
    let mut bytecodes = vec![];
    let file_path = format!("output/{}", dirname);
    env::set_current_dir(file_path.clone())?;
    let output2 = Command::new("forge").arg("build").output()?;
    assert!(output2.status.success());
    let output3 = Command::new("forge")
        .arg("inspect")
        .arg("LambdaAppGateway")
        .arg("bytecode")
        .output()?;
    let bytecode = String::from_utf8(output3.stdout).unwrap();

    let lambda_app_gateway = "out/LambdaAppGateway.sol/LambdaAppGateway.json";
    let lambda_app_deployer ="out/LambdaDeployer.sol/LambdaDeployer.json";

    let abi_app_gateway = get_abi_from_path(lambda_app_gateway)?;
    let abi_app_deployer = get_abi_from_path(lambda_app_deployer)?;

    bytecodes.push(bytecode.trim().to_string());
    let output4 = Command::new("forge")
        .arg("inspect")
        .arg("LambdaDeployer")
        .arg("bytecode")
        .output()?;
    let bytecode = String::from_utf8(output4.stdout).unwrap();
    bytecodes.push(bytecode.trim().to_string());
    Ok((bytecodes[0].clone(), abi_app_gateway, bytecodes[1].clone(), abi_app_deployer))
}

fn get_abi_from_path(path: &str) -> std::result::Result<Value, Box<dyn std::error::Error>> {
    let mut file = File::open(path)?;
    let mut content = String::new();
    file.read_to_string(&mut content)?;
    let json: Value = serde_json::from_str(&content)?;
    let val = json
        .get("abi")
        .ok_or_else(|| "ABI field not found in JSON".into())
        .map(|abi| abi.clone());
    val
}

// #[test]
// fn test_get_contract_bytecode() {
//     let lambda_hash = 3515848652055917867;
//     let result = get_contract_bytecode(lambda_hash);
//     println!("result: {:?}", result);
// }
