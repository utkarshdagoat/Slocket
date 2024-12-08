use actix_web::{web, HttpResponse};
use parser::compile::get_contract_bytecode;

use crate::{AppState, CompileInput, CompileOutput};

pub mod write_lambda;

pub async fn compile_lambda(
    data: web::Data<AppState>,
    lambda: web::Json<CompileInput>,
) -> HttpResponse {
    let lambda_dir = lambda.0.dirname;
    match get_contract_bytecode(lambda_dir) {
        Ok((appgateway_bytecode, appgateway_abi, deployer_bytecode, deployer_abi)) => {
            return HttpResponse::Ok().json(CompileOutput {
                appgateway_bytecode,
                deployer_bytecode,
                appgateway_abi,
                deployer_abi,
            })
        }
        Err(e) => {
            return HttpResponse::InternalServerError()
                .json(format!("Failed to compile lambda: {}", e))
        }
    };
}
