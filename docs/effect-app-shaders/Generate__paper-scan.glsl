



uniform int textureMode;     // value=0, min=0, max=1, step=1, desc=texture mode: 0=black paper, 1=white paper
uniform float opacity;       // value=1.0, min=0.0, max=1.0, step=0.01, desc=blend opacity
uniform float texScale;      // value=1.0, min=1.0, max=3.0, step=0.01, desc=texture zoom (for scaling in/out only)
uniform float brightness;    // value=0.0, min=-1.0, max=1.0, step=0.01, desc=overlay brightness
uniform float contrast;      // value=1.0, min=0.0, max=3.0, step=0.01, desc=overlay contrast
uniform float noiseIntensity;    //label=distortion, value=1.0, min=0.0, max=3.0, step=0.1, desc=high-frequency noise distortion intensity
uniform float noiseScale;        //label=distorion scale, value=500.0, min=300.0, max=1000.0, step=1.0, desc=high-frequency noise pattern scale


vec3 screen(vec3 s, vec3 d) {
    return s + d - s * d;
}

vec3 multiply(vec3 s, vec3 d) {
    return s * d;
}

vec3 overlay(vec3 s, vec3 d) {
    return mix(2.0 * s * d, 1.0 - 2.0 * (1.0 - s) * (1.0 - d), step(0.5, d));
}


vec3 adjustBrightnessContrast(vec3 color, float brightness, float contrast) {
    
    color += brightness;
    
    
    color = (color - 0.5) * contrast + 0.5;
    
    
    return clamp(color, 0.0, 1.0);
}


float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}


vec2 generateNoiseDistortion(vec2 uv, float scale, float intensity) {
    if (intensity <= 0.0) return vec2(0.0);
    
    
    vec2 noiseUV = uv * scale;
    
    
    vec2 p1 = floor(noiseUV);
    vec2 f1 = fract(noiseUV);
    
    float a1 = hash(p1);
    float b1 = hash(p1 + vec2(1.0, 0.0));
    float c1 = hash(p1 + vec2(0.0, 1.0));
    float d1 = hash(p1 + vec2(1.0, 1.0));
    
    vec2 u1 = f1 * f1 * (3.0 - 2.0 * f1);
    float noiseX = mix(mix(a1, b1, u1.x), mix(c1, d1, u1.x), u1.y);
    
    
    vec2 p2 = floor(noiseUV + vec2(127.0, 311.0));
    vec2 f2 = fract(noiseUV + vec2(127.0, 311.0));
    
    float a2 = hash(p2);
    float b2 = hash(p2 + vec2(1.0, 0.0));
    float c2 = hash(p2 + vec2(0.0, 1.0));
    float d2 = hash(p2 + vec2(1.0, 1.0));
    
    vec2 u2 = f2 * f2 * (3.0 - 2.0 * f2);
    float noiseY = mix(mix(a2, b2, u2.x), mix(c2, d2, u2.x), u2.y);
    
    
    
    vec2 distortion = vec2(noiseX - 0.5, noiseY - 0.5) * intensity / iResolution.xy;
    
    return distortion;
}



vec2 calculateFitUV(vec2 uv, float scale) {
    
    float canvasAspect = iResolution.x / iResolution.y;
    
    
    
    vec2 scaledUV = (uv - 0.5) / scale + 0.5;
    
    return scaledUV;
}


vec4 getPaperTexture(vec2 uv) {
    if (textureMode == 0) {
        
        return texture(iChannel5, uv);
    } else {
        
        return texture(iChannel6, uv);
    }
}


vec3 applyOptimalBlend(vec3 source, vec3 destination, int mode) {
    if (mode == 0) {
        
        return screen(source, destination);
    } else {
        
        return multiply(source, destination);
    }
}


void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    
    vec2 uv = fragCoord.xy / iResolution.xy;
    
    
    vec2 noiseDistortion = generateNoiseDistortion(uv, noiseScale, noiseIntensity);
    vec2 distortedUV = uv + noiseDistortion;
    
    
    vec4 baseColor = texture(iChannel0, distortedUV);
    
    
    
    vec2 paperUV = calculateFitUV(uv, texScale);
    
    
    vec4 paperColor = getPaperTexture(paperUV);
    
    
    vec3 adjustedPaper = adjustBrightnessContrast(paperColor.rgb, brightness, contrast);
    paperColor.rgb = adjustedPaper;
    
    
    
    vec3 blendedColor = applyOptimalBlend(paperColor.rgb, baseColor.rgb, textureMode);
    
    
    vec3 finalColor = mix(baseColor.rgb, blendedColor, opacity * paperColor.a);
    
    
    fragColor = vec4(finalColor, baseColor.a);
}
