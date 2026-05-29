// @animated



// @gips_version=1 @coord=rel


const float SQRT_HALF = 0.70710678118;          
const float GAMMA = 2.2;
const vec3 LUMA = vec3(0.2126, 0.7152, 0.0722);


uniform float uFreq;        //label=repetitions,          value=33,  min=5,   max=60, step=1
uniform float uWMin;        //label=minimum thickness,    value=0,   min=0.001, max=0.1, step=0.001
uniform float uWMax;        //label=maximum thickness,    value=1.0, min=0.1, max=1.0, step=0.01
uniform float uAngle;       //label=angle,                value=90,  min=0,   max=360, step=1
uniform float uEdge;        //label=edge softness,        value=0.5, min=0,   max=1,   step=0.01
uniform int uPattern;     //label=pattern type,         value=1,   min=0,   max=1,   step=1
uniform float uScrollSpeed; //label=animation speed,      value=0.0, min=-5,  max=5,   step=0.01
uniform float ledMode;      //label=color mode,           value=1,   ui=switch
uniform vec3 uPhaseRGB;    //label=(red shift, green shift, blue shift), value=(0.1,0,0), min=0, max=1
uniform float bendayMode;   //label=shift,        value=0,   ui=switch
uniform float uShiftFreq;   //label=row shift freq,       value=8,   min=1,   max=50,  step=1



const vec2 uvOffset = vec2(0.0);
const vec2 uvScale = vec2(1.0);


vec2 toRelCoord(vec2 p) {                       
    float asp = iResolution.x / iResolution.y;
    vec2 scl = (asp > 1.0) ? vec2(asp, 1.0) : vec2(1.0, 1.0 / asp);
    return ((p / iResolution.xy) * 2.0 - 1.0) * scl;
}

float heightField(vec2 ndc, vec2 rotN) {
    return (uPattern == 0) ? rotN.y * 0.5 + 0.5                       
    : length(ndc) * SQRT_HALF;                
}


void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    
    
    
    vec2 ndc = toRelCoord(fragCoord);               
    vec2 uv = fragCoord / iResolution.xy;          

    
    
    
    vec3 src = texture(iChannel0, clamp(uvOffset + uv * uvScale, 0.0, 1.0)).rgb;
    float lum = pow(dot(src, LUMA), 1.0 / GAMMA);

    
    
    
    float rad = radians(uAngle);
    mat2 rot = mat2(cos(rad), -sin(rad), sin(rad), cos(rad));
    vec2 rotN = rot * ndc;

    
    
    
    float aaR = mix(0.5, 5.0, pow(uEdge, 2.0));

    
    
    
    float baseCoord;   
    float rowCoord;    


    if(uPattern == 0) {
        baseCoord = rotN.y;      
        rowCoord = rotN.x;      
    }

    else {
        float r = length(ndc);                         
        float ang = atan(ndc.y, ndc.x) / (2.0 * 3.141592); 

    
    
        baseCoord = r;                                  
        rowCoord = ang + 0.5;                          
    }

    
    
    
    float rowId = floor(rowCoord * uShiftFreq);   
    float rowShift = (bendayMode > 0.5)              
    ? mod(rowId, 2.0) * 0.5           
    : 0.0;

    vec3 outRGB = vec3(1.0);                         

    
    
    
    if(ledMode > 0.5) {
        for(int ci = 0; ci < 3; ++ci) {
            
            float basePhase = baseCoord * uFreq
                           + uPhaseRGB[ci]              
                           + iTime * uScrollSpeed;      

            float dAA = fwidth(basePhase) * aaR;    

            
            float phase = basePhase + rowShift;       

            
            float stripe = abs(fract(phase) * 2.0 - 1.0);

            float thick = mix(uWMax, uWMin, src[ci]);
            float mask = 1.0 - smoothstep(thick - dAA, thick + dAA, stripe);

            outRGB[ci] = 1.0 - mask;
        }
    }
    
    
    
    else {
        
        float basePhase = baseCoord * uFreq
                        + iTime * uScrollSpeed;        

        float dAA = fwidth(basePhase) * aaR;    

        
        float phase = basePhase + rowShift;       

        
        float stripe = abs(fract(phase) * 2.0 - 1.0);

        float thick = mix(uWMax, uWMin, lum);
        float mask = 1.0 - smoothstep(thick - dAA, thick + dAA, stripe);

        outRGB = vec3(1.0 - mask);
    }

    fragColor = vec4(outRGB, 1.0);
}
