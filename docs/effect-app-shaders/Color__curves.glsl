uniform int curve_apply_mode; // ui=switcher, label=apply mode, options=[N:0|C:1|L:2], pro
uniform float d_curve;          // ui=curve, label="RGB curve"
uniform float d_curve_r;        // ui=curve, label="Red channel"
uniform float d_curve_g;        // ui=curve, label="Green channel"
uniform float d_curve_b;        // ui=curve, label="Blue channel"

vec4 sampleCurves(float x) {
    return texture(iChannel5, vec2(clamp(x, 0.0, 1.0), 0.5));
}

float applyMasterCurve(float v) {
    if (d_curve > 0.5) return v;
    return sampleCurves(v).a;
}

float applyRedCurve(float v) {
    if (d_curve_r > 0.5) return v;
    return sampleCurves(v).r;
}

float applyGreenCurve(float v) {
    if (d_curve_g > 0.5) return v;
    return sampleCurves(v).g;
}

float applyBlueCurve(float v) {
    if (d_curve_b > 0.5) return v;
    return sampleCurves(v).b;

}

vec3 applyColorCurves(vec3 color) {
    float r = applyRedCurve(applyMasterCurve(color.r));
    float g = applyGreenCurve(applyMasterCurve(color.g));
    float b = applyBlueCurve(applyMasterCurve(color.b));
    return clamp(vec3(r, g, b), 0.0, 1.0);
}

vec3 applyLightnessCurve(vec3 color) {
    float luma = dot(color, vec3(0.2126, 0.7152, 0.0722));
    float curved = applyMasterCurve(luma);
    float scale = luma > 0.00001 ? (curved / luma) : 0.0;
    return clamp(color * scale, 0.0, 1.0);
}

float luma709(vec3 color) {
    return dot(color, vec3(0.2126, 0.7152, 0.0722));
}

vec3 clipColor(vec3 color) {
    float l = luma709(color);
    float n = min(min(color.r, color.g), color.b);
    float x = max(max(color.r, color.g), color.b);

    if (n < 0.0) {
        color = vec3(l) + (color - vec3(l)) * (l / (l - n));
    }

    if (x > 1.0) {
        color = vec3(l) + (color - vec3(l)) * ((1.0 - l) / (x - l));
    }

    return color;
}

vec3 setLuma(vec3 color, float luma) {
    color += vec3(luma - luma709(color));
    return clamp(clipColor(color), 0.0, 1.0);
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = fragCoord / iResolution.xy;
    vec4 base = texture(iChannel0, uv);

    vec3 color;
    vec3 curved = applyColorCurves(base.rgb);
    float baseLuma = luma709(base.rgb);
    float curvedLuma = luma709(curved);
    if (curve_apply_mode == 0) {
        
        color = curved;
    } else if (curve_apply_mode == 1) {
        
        color = setLuma(curved, baseLuma);
    } else {
        
        color = setLuma(base.rgb, curvedLuma);
    }

    fragColor = vec4(color, base.a);
}
