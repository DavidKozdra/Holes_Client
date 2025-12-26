//used in ui.js
function checkName() {
    if (nameInput.value().length > 0) {
        nameEntered = true;
    } else {
        nameEntered = false;
    }
}

function flipImage(img) {
  // Create an off-screen graphics buffer
  let flippedImg = createGraphics(img.width, img.height);
  
  // Set willReadFrequently for better performance with getImageData operations
  flippedImg.drawingContext.willReadFrequently = true;
  
  // Disable smoothing for the buffer itself
  flippedImg.noSmooth();
  
  // Flip horizontally
  flippedImg.push();
  flippedImg.scale(-1, 1);
  flippedImg.image(img, -img.width, 0);
  flippedImg.pop();
  
  return flippedImg;
}

//used in objects.js and items.js
function checkParams(inputs, inputNames, checks){
    for(let i = 0; i < inputs.length; i++){
        if(checks[i] == "int"){
            if(parseInt(inputs[i]) !== inputs[i]){
                throw new TypeError(`${inputNames[i]} is not of type int, ${inputs[i]} was passed as ${inputNames[i]}`);
            }
        }
        else if(checks[i] == "boolean"){
            if(typeof inputs[i] !== "boolean" && inputs[i] !== undefined){
                throw new TypeError(`${inputNames[i]} is not of type boolean, ${inputs[i]} was passed as ${inputNames[i]}`);
            }
        }
        else{
            if(typeof inputs[i] != checks[i]){
                throw new TypeError(`${inputNames[i]} is not of type ${checks[i]}, ${inputs[i]} was passed as ${inputNames[i]}`);
            }
        }
    }
}

//used in objects.js and items.js
function getParamNames(func){
    return func.toString().split("{")[0].split("(")[1].split(")")[0].split(",");
}