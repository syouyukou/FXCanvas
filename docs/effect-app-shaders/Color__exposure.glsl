



// @gips_version=1

uniform float exposure;        // value=0, min=-5, max=5, desc=EV
uniform float gamma;     // value=2.2, min=0.5, max=10, desc=working gamma
uniform float gamut_mapping;  // desc=preserve hue in clipped regions
uniform float reinhard;  // ui=switch, desc=brighten with Reinhard tone compression
uniform float show_clipping;  // ui=switch, desc=mark clipped regions

vec3 run(vec3 rgb) {
    
    rgb = pow(rgb, vec3(gamma));

    
    float gain = exp2(exposure);
    rgb *= gain;

    
    if (reinhard > 0.5) {
        rgb = rgb / (rgb + 1.0);
        
        rgb *= (gain + 1.0) / gain;
    }

    
    float minRGB = min(min(rgb.r, rgb.g), rgb.b);
    float maxRGB = max(max(rgb.r, rgb.g), rgb.b);
    if ((maxRGB > 1.0) && (minRGB < maxRGB) && (gamut_mapping > 0.0)) {
        rgb = mix(rgb, vec3(minRGB) + (rgb - vec3(minRGB)) * vec3((1.0 - minRGB) / (maxRGB - minRGB)), gamut_mapping);
    }

    
    rgb = pow(rgb, vec3(1.0 / gamma));

    
    if (show_clipping > 0.5) {
        if (maxRGB >= (254.0/255.0)) { return vec3(1.0, 0.0, 0.0); }
        if (minRGB <=   (1.0/255.0)) { return vec3(0.0, 0.0, 1.0); }
    }

    return rgb;
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = fragCoord / iResolution.xy;
    vec4 tex = texture(iChannel0, uv);

    vec3 rgb = (tex.a < 0.01) ? tex.rgb : run(tex.rgb);
    fragColor = vec4(rgb, tex.a);
}
