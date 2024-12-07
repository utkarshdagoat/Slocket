use serde_json::Value;
use std::process::Command;
use std::{env, fs};

pub fn get_contract_bytecode(dirname: String) -> Result<(String,String), Box<dyn std::error::Error>> {
    let mut bytecodes = vec![];
    let file_path = format!("output/{}", dirname );
    println!("file_path: {:?}", file_path);
    env::set_current_dir(file_path)?;
    let output2 = Command::new("forge").arg("build").output()?;
    assert!(output2.status.success());
    let output3 = Command::new("forge")
        .arg("inspect")
        .arg("LambdaAppGateway")
        .arg("bytecode")
        .output()?;
    let bytecode = String::from_utf8(output3.stdout).unwrap();
    bytecodes.push(bytecode.trim().to_string());
    let output4 = Command::new("forge")
        .arg("inspect")
        .arg("LambdaDeployer")
        .arg("bytecode")
        .output()?;
    let bytecode = String::from_utf8(output4.stdout).unwrap();
    bytecodes.push(bytecode.trim().to_string());
    Ok((bytecodes[0].clone(), bytecodes[1].clone()))
}

// #[test]
// fn test_get_contract_bytecode() {
//     let lambda_hash = 3515848652055917867;
//     let result = get_contract_bytecode(lambda_hash);
//     println!("result: {:?}", result);
// }
