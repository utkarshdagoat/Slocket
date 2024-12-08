use actix_cors::Cors;
use actix_web::{web, App, HttpServer};
use handlers::{compile_lambda, write_lambda::handle_lambda};
use parser::ContractGenerator;
use serde::{Deserialize, Serialize};
use std::sync::Mutex;

mod handlers;
mod indexers;
mod metrics;
mod db;

#[derive(Deserialize)]
struct LambdaInput {
    function: String,
    lambda_name: String,
}

#[derive(Deserialize)]
struct CompileInput {
    dirname: String,
}

#[derive(Serialize, Deserialize)]
struct CompileOutput {
    appgateway_bytecode: String,
    deployer_bytecode: String,
    appgateway_abi: serde_json::Value,
    deployer_abi: serde_json::Value,
}

#[derive(Serialize, Deserialize)]
struct LambdaResponse {
    success: bool,
    message: String,
    dirname: Option<String>,
    state_string: Option<String>,
}

struct AppState {
    generator: Mutex<ContractGenerator>,
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    let generator = web::Data::new(AppState {
        generator: Mutex::new(ContractGenerator::default()),
    });

    println!("Starting server at http://localhost:8080");

    HttpServer::new(move || {
        let cors = Cors::default()
            .allow_any_origin()
            .allow_any_method()
            .allow_any_header()
            .max_age(3600);

        App::new()
            .wrap(cors)
            .app_data(generator.clone())
            .route("/handle-lambda", web::post().to(handle_lambda))
            .route("/compile", web::post().to(compile_lambda))
    })
    .bind("0.0.0.0:8080")?
    .run()
    .await
}
