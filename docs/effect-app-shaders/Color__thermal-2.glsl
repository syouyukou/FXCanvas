


// @gips_version=1

uniform float gradient_type;   // value=3.0, min=0.0, max=9.0, step=1.0, desc=gradient preset
uniform float gradient_shift;  // value=0.0, min=0.0, max=1.0, step=0.01, desc=shift gradient mapping
uniform float gradient_repeat; // value=0.7, min=0.1, max=10.0, step=0.1, desc=gradient repetitions

#define sat(x) clamp(x, 0.0, 1.0)


vec3 getGradientColor(float t, int type) {
    t = sat(t);
    
    
    if (type == 0) {
        if (t < 0.16) return mix(vec3(0.0, 0.0, 0.0), vec3(0.0, 0.0, 0.5), t / 0.16);
        if (t < 0.33) return mix(vec3(0.0, 0.0, 0.5), vec3(0.5, 0.0, 0.5), (t - 0.16) / 0.17);
        if (t < 0.50) return mix(vec3(0.5, 0.0, 0.5), vec3(1.0, 0.0, 0.0), (t - 0.33) / 0.17);
        if (t < 0.66) return mix(vec3(1.0, 0.0, 0.0), vec3(1.0, 0.5, 0.0), (t - 0.50) / 0.16);
        if (t < 0.83) return mix(vec3(1.0, 0.5, 0.0), vec3(1.0, 1.0, 0.0), (t - 0.66) / 0.17);
        return mix(vec3(1.0, 1.0, 0.0), vec3(1.0, 1.0, 1.0), (t - 0.83) / 0.17);
    }
    
    
    if (type == 1) {
        if (t < 0.25) return mix(vec3(0.0, 0.0, 0.0), vec3(0.5, 0.0, 0.0), t / 0.25);
        if (t < 0.50) return mix(vec3(0.5, 0.0, 0.0), vec3(1.0, 0.0, 0.0), (t - 0.25) / 0.25);
        if (t < 0.75) return mix(vec3(1.0, 0.0, 0.0), vec3(1.0, 0.5, 0.0), (t - 0.50) / 0.25);
        return mix(vec3(1.0, 0.5, 0.0), vec3(1.0, 1.0, 1.0), (t - 0.75) / 0.25);
    }
    
    
    if (type == 2) {
        if (t < 0.16) return mix(vec3(1.0, 0.0, 0.0), vec3(1.0, 0.5, 0.0), t / 0.16);
        if (t < 0.33) return mix(vec3(1.0, 0.5, 0.0), vec3(1.0, 1.0, 0.0), (t - 0.16) / 0.17);
        if (t < 0.50) return mix(vec3(1.0, 1.0, 0.0), vec3(0.0, 1.0, 0.0), (t - 0.33) / 0.17);
        if (t < 0.66) return mix(vec3(0.0, 1.0, 0.0), vec3(0.0, 1.0, 1.0), (t - 0.50) / 0.16);
        if (t < 0.83) return mix(vec3(0.0, 1.0, 1.0), vec3(0.0, 0.0, 1.0), (t - 0.66) / 0.17);
        return mix(vec3(0.0, 0.0, 1.0), vec3(0.5, 0.0, 0.5), (t - 0.83) / 0.17);
    }
    
    
    if (type == 3) {
        if (t < 0.33) return mix(vec3(0.0, 0.0, 0.5), vec3(0.0, 0.5, 1.0), t / 0.33);
        if (t < 0.66) return mix(vec3(0.0, 0.5, 1.0), vec3(0.0, 1.0, 0.5), (t - 0.33) / 0.33);
        return mix(vec3(0.0, 1.0, 0.5), vec3(1.0, 1.0, 0.0), (t - 0.66) / 0.34);
    }
    
    
    if (type == 4) {
        if (t < 0.33) return mix(vec3(0.0, 0.0, 0.0), vec3(1.0, 0.0, 0.0), t / 0.33);
        if (t < 0.66) return mix(vec3(1.0, 0.0, 0.0), vec3(1.0, 1.0, 0.0), (t - 0.33) / 0.33);
        return mix(vec3(1.0, 1.0, 0.0), vec3(1.0, 1.0, 1.0), (t - 0.66) / 0.34);
    }
    
    
    if (type == 5) {
        if (t < 0.25) return mix(vec3(0.0, 0.0, 0.0), vec3(0.3, 0.0, 0.4), t / 0.25);
        if (t < 0.50) return mix(vec3(0.3, 0.0, 0.4), vec3(0.8, 0.0, 0.3), (t - 0.25) / 0.25);
        if (t < 0.75) return mix(vec3(0.8, 0.0, 0.3), vec3(1.0, 0.5, 0.0), (t - 0.50) / 0.25);
        return mix(vec3(1.0, 0.5, 0.0), vec3(1.0, 1.0, 0.5), (t - 0.75) / 0.25);
    }
    
    
    if (type == 6) {
        if (t < 0.25) return mix(vec3(0.27, 0.0, 0.33), vec3(0.13, 0.2, 0.5), t / 0.25);
        if (t < 0.50) return mix(vec3(0.13, 0.2, 0.5), vec3(0.0, 0.5, 0.5), (t - 0.25) / 0.25);
        if (t < 0.75) return mix(vec3(0.0, 0.5, 0.5), vec3(0.3, 0.7, 0.3), (t - 0.50) / 0.25);
        return mix(vec3(0.3, 0.7, 0.3), vec3(0.9, 0.9, 0.0), (t - 0.75) / 0.25);
    }
    
    
    if (type == 7) {
        if (t < 0.20) return mix(vec3(0.0, 0.0, 0.0), vec3(0.0, 0.2, 0.0), t / 0.20);
        if (t < 0.40) return mix(vec3(0.0, 0.2, 0.0), vec3(0.0, 0.5, 0.0), (t - 0.20) / 0.20);
        if (t < 0.60) return mix(vec3(0.0, 0.5, 0.0), vec3(0.2, 0.8, 0.2), (t - 0.40) / 0.20);
        if (t < 0.80) return mix(vec3(0.2, 0.8, 0.2), vec3(0.6, 1.0, 0.4), (t - 0.60) / 0.20);
        return mix(vec3(0.6, 1.0, 0.4), vec3(1.0, 1.0, 0.9), (t - 0.80) / 0.20);
    }
    
    
    if (type == 8) {
        if (t < 0.16) return mix(vec3(0.024, 0.0, 0.039), vec3(0.894, 0.020, 0.886), t / 0.16);
        if (t < 0.26) return mix(vec3(0.894, 0.020, 0.886), vec3(0.067, 0.0, 0.627), (t - 0.16) / 0.10);
        if (t < 0.37) return mix(vec3(0.067, 0.0, 0.627), vec3(0.020, 0.851, 0.831), (t - 0.26) / 0.11);
        if (t < 0.51) return mix(vec3(0.020, 0.851, 0.831), vec3(0.027, 0.325, 0.027), (t - 0.37) / 0.14);
        if (t < 0.64) return mix(vec3(0.027, 0.325, 0.027), vec3(0.898, 0.875, 0.027), (t - 0.51) / 0.13);
        if (t < 0.76) return mix(vec3(0.898, 0.875, 0.027), vec3(0.518, 0.020, 0.027), (t - 0.64) / 0.12);
        if (t < 0.87) return mix(vec3(0.518, 0.020, 0.027), vec3(0.831, 0.200, 0.192), (t - 0.76) / 0.11);
        return mix(vec3(0.831, 0.200, 0.192), vec3(0.984, 0.933, 0.933), (t - 0.87) / 0.13);
    }
    
    
    return mix(vec3(0.0, 0.0, 0.0), vec3(1.0, 1.0, 1.0), t);
}

vec3 run(vec3 toneMappedGrayscale) {
    
    float luma = toneMappedGrayscale.r;
    
    
    float t = luma * gradient_repeat + gradient_shift;
    
    t = (gradient_repeat <= 1.01) ? sat(t) : fract(t);
    
    
    int type = int(gradient_type);
    return getGradientColor(t, type);
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = fragCoord / iResolution.xy;
    vec4 tex = texture(iChannel0, uv);
    
    
    vec3 rgb = (tex.a < 0.01) ? tex.rgb : run(tex.rgb);
    
    fragColor = vec4(rgb, tex.a);
}

