



// @gips_version=1 @coord=rel

precision mediump float;


#define CIRCULAR_KERNEL

const vec2 offset = vec2(0.0, 0.0);
const vec2 texScale = vec2(1.0, 1.0);

uniform float dilationSize;    //label=outline, value=0, min=0, max=10, step=1, desc=dilation kernel size (0 disables)
uniform float dilationStrength; //label=outline strength, value=1.0, min=0.0, max=1.0, step=0.01, desc=dilation blend strength
uniform float kernelType;     //label=outline type, value=0, min=0, max=2, step=1, desc=kernel: 0=box, 1=circular, 2=diamond

vec2 toRelCoord(vec2 coords) {
    float aspect = iResolution.x / iResolution.y;
    vec2 increaseLongSide = aspect > 1.0 ? vec2(aspect, 1.0) : vec2(1.0, 1.0 / aspect);
    return ((coords / iResolution.xy) * 2.0 - 1.0) * increaseLongSide;
}

vec2 fromRelCoord(vec2 coords) {
    float aspect = iResolution.x / iResolution.y;
    vec2 increaseLongSide = aspect > 1.0 ? vec2(aspect, 1.0) : vec2(1.0, 1.0 / aspect);
    return ((coords / increaseLongSide) + 1.0) / 2.0;
}

vec4 pixel(in vec2 pos) {
    vec2 uv = fromRelCoord(pos);
    uv = offset + uv * texScale;
    return textureLod(iChannel0, uv, 0.0);
}

float luminance(in vec3 rgb) {
    return dot(rgb, vec3(0.299, 0.587, 0.114));
}


vec3 dilateThresholdLines(in vec2 pos, in int size) {
    if (size <= 0) return pixel(pos).rgb;
    
    vec3 cc = pixel(pos).rgb;
    vec3 tc = cc;
    float cl = luminance(cc);
    
    
    vec2 texelSize = 1.0 / iResolution.xy;
    vec2 relTexelSize = vec2(texelSize.x * 2.0 * (iResolution.x / iResolution.y > 1.0 ? (iResolution.x / iResolution.y) : 1.0),
                            texelSize.y * 2.0 * (iResolution.x / iResolution.y < 1.0 ? (iResolution.y / iResolution.x) : 1.0));

    for (int x = -8; x <= 8; ++x) {
        for (int y = -8; y <= 8; ++y) {
            if (x > size || x < -size || y > size || y < -size) continue;
            
            
            bool skipPixel = false;
            
            if (int(kernelType) == 2) {
                
                if (abs(x) > size - abs(y)) skipPixel = true;
            } else if (int(kernelType) == 1) {
                
                if (distance(vec2(x, y), vec2(0, 0)) > float(size)) skipPixel = true;
            }
            
            
            if (skipPixel) continue;
            
            vec3 s = pixel(pos + vec2(float(x), float(y)) * relTexelSize).rgb;
            float b = luminance(s);
            
            
            if (b < cl) {
                cl = b;
                tc = s;
            }
        }
    }
    
    return tc;
}

vec4 run(vec2 pos) {
    vec4 originalColor = pixel(pos);
    
    
    if (dilationSize > 0.5) {
        vec3 dilatedColor = dilateThresholdLines(pos, int(dilationSize));
        
        
        vec3 finalColor = mix(originalColor.rgb, dilatedColor, dilationStrength);
        return vec4(finalColor, originalColor.a);
    } else {
        
        return originalColor;
    }
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = toRelCoord(fragCoord);
    fragColor = run(uv);
}