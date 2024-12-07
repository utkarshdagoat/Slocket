use actix_web::{web, HttpResponse};
use std::hash::DefaultHasher;
use std::hash::Hash;
use std::hash::Hasher;

use crate::{AppState, LambdaInput, LambdaResponse};

pub async fn handle_lambda(
    data: web::Data<AppState>,
    lambda: web::Json<LambdaInput>,
) -> HttpResponse {
    let mut state_string = None;
    let mut dirname = None;

    let mut generator = match data.generator.lock() {
        Ok(generator) => generator,
        Err(e) => {
            return HttpResponse::InternalServerError().json(LambdaResponse {
                success: false,
                message: format!("Failed to acquire lock: {}", e),
                dirname,
                state_string,
            })
        }
    };

    if let Err(e) = generator.process_lambda(lambda.function.clone()) {
        return HttpResponse::BadRequest().json(LambdaResponse {
            success: false,
            message: format!("Failed to process lambda: {}", e),
            dirname,
            state_string,
        });
    }
    match generator.write_lambda(lambda.function.clone(), lambda.lambda_name.clone()) {
        Err(e) => {
            return HttpResponse::BadRequest().json(LambdaResponse {
                success: false,
                message: format!("Failed to write lambda: {}", e),
                dirname,
                state_string,
            });
        }
        Ok((state, final_dir)) => {
            state_string = Some(state);
            dirname = Some(final_dir);
        }
    }

    if let Err(e) = generator.write_apg(dirname.clone().unwrap()) {
        return HttpResponse::BadRequest().json(LambdaResponse {
            success: false,
            message: format!("Failed to write APG: {}", e),
            dirname,
            state_string,
        });
    }

    HttpResponse::Ok().json(LambdaResponse {
        success: true,
        message: format!(
            "Successfully processed and wrote lambda '{}'",
            lambda.lambda_name
        ),
        dirname,
        state_string,
    })
}
