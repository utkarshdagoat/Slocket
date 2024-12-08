export function addEmitToLambda(sourceCode: string): string {
    // Split the code into lines
    const lines = sourceCode.split('\n');
    let inLambdaFunction = false;
    let bracketCount = 0;
    let result = [];
  
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Check if we're entering the lambda function
      if (line.includes('function lambda')) {
        inLambdaFunction = true;
      }
      
      // Count brackets if we're in the lambda function
      if (inLambdaFunction) {
        bracketCount += (line.match(/{/g) || []).length;
        bracketCount -= (line.match(/}/g) || []).length;
        
        // If this is the closing bracket of the function
        if (bracketCount === 0 && line.includes('}')) {
          // Add the emit statement before the closing bracket
          const indentation = line.match(/^\s*/)?.[0] || '    ';
          result.push(`${indentation}emit LambdaCalled();`);
          result.push(line);
          inLambdaFunction = false;
          continue;
        }
      }
      
      result.push(line);
    }
  
    return result.join('\n');
  }
  