// AUTO-GENERATED from docs/effect-app-shaders/Blur__depth-of-field.glsl
// Regenerate: python3 scripts/adapt-depth-of-field-shader.py

export const DEPTH_OF_FIELD_BODY = `
#define PI 3.14159265359
#define GOLDEN_ANGLE 2.39996322972865332
#define MAX_SAMPLES 1000










vec3 srgbToLinear(vec3 c) {
    vec3 lo = c / 12.92;
    vec3 hi = pow((c + 0.055) / 1.055, vec3(2.4));
    return mix(lo, hi, step(0.04045, c));
}

vec3 linearToSrgb(vec3 c) {
    c = max(c, vec3(0.0));
    vec3 lo = c * 12.92;
    vec3 hi = 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055;
    return mix(lo, hi, step(0.0031308, c));
}



float deg2rad(float d) { return d * (PI / 180.0); }

mat2 rot2(float a) {
    float c = cos(a), s = sin(a);
    return mat2(c, -s, s, c);
}



float ngonBoundary(float theta, float N) {
    float a = 2.0 * PI / N;
    float t = mod(theta + 0.5*a, a) - 0.5*a;
    return cos(PI / N) / max(cos(t), 1e-6);
}

float apertureBoundary(float theta) {
    if (u_blades < 3.0) return 1.0; 
    float N = max(u_blades, 3.0);
    float poly = ngonBoundary(theta, N);
    return mix(poly, 1.0, clamp(u_roundness, 0.0, 1.0));
}

float apertureFeather(float r01) {
    float f = clamp(u_feather, 0.0, 0.95);
    if (f <= 0.0) return 1.0;
    return smoothstep(1.0, 1.0 - f, r01);
}



float catadioptricTransmission(float r01) {
    if (u_catadioptric <= 0.0) return 1.0; 
    
    
    float obstruction = u_catadioptric;
    
    
    return smoothstep(obstruction - 0.05, obstruction, r01);
}



vec2 vogelDir(float i, out float theta) {
    theta = i * GOLDEN_ANGLE;
    return vec2(cos(theta), sin(theta));
}



vec2 applyAnamorphic(vec2 off) {
    float a = max(u_anamorphic, 1.0);
    off.x *= a;
    off.y *= (1.0 / a);
    return off;
}



vec3 Bokeh(sampler2D tex, vec2 uv, float u_radius, float amount)
{
    vec3 acc = vec3(0.0);
    vec3 div = vec3(0.0);

    
    vec2 pixel = vec2(u_resolution.y / max(u_resolution.x, 1e-6), 1.0) * u_radius;

    float rot = deg2rad(u_aperture_rot);
    float N = clamp(u_samples, 1.0, float(MAX_SAMPLES));

    for (int si = 0; si < MAX_SAMPLES; ++si)
    {
        float i = float(si);
        if (i >= N) break;

        float theta;
        vec2 dir = vogelDir(i, theta);

        
        float r01 = sqrt((i + 0.5) / N);

        float th = theta + rot;
        float R = apertureBoundary(th);

        
        vec2 off = (rot2(rot) * dir) * (r01 * R);

        
        off = applyAnamorphic(off);

        
        float trans = apertureFeather(r01);
        
        
        trans *= catadioptricTransmission(r01);

        vec3 col = srgbToLinear(texture(tex, uv + pixel * off).rgb);

        
        vec3 w = vec3(5.0) + pow(col, vec3(9.0)) * amount;
        w *= trans;

        acc += col * w;
        div += w;
    }

    return acc / max(div, vec3(1e-6));
}



vec3 debugApertureFootprint(vec2 uv)
{
    vec2 p = uv - vec2(0.5, 0.5); 
    float ar = u_resolution.x / max(u_resolution.y, 1e-6);
    p.x *= ar;

    float displayScale = 0.25; 
    
    
    float a = max(u_anamorphic, 1.0);
    vec2 pTransformed = p;
    pTransformed.x /= a;
    pTransformed.y *= a;
    
    
    pTransformed = rot2(-deg2rad(u_aperture_rot)) * pTransformed;
    
    
    float ang = atan(pTransformed.y, pTransformed.x);
    float r = length(pTransformed);
    
    
    float R = apertureBoundary(ang);
    
    
    float edge = smoothstep(R * displayScale + 0.002, R * displayScale - 0.002, r);
    
    
    if (u_catadioptric > 0.0) {
        float centerBlock = smoothstep(u_catadioptric * displayScale - 0.002, u_catadioptric * displayScale + 0.002, r);
        edge *= centerBlock;
    }
    
    return vec3(edge);
}



float radialMask(vec2 uv)
{
    vec2 p = uv - u_center;

    
    float ar = u_resolution.x / max(u_resolution.y, 1e-6);
    p.x *= ar;

    
    p = rot2(-deg2rad(u_mask_rotation)) * p;

    
    p /= max(u_radius, 1e-6);

    
    if (u_aspect > 0.0) {
        float stretch = 1.0 + u_aspect;
        float normalize = 1.0 / sqrt(stretch);
        p.x *= stretch * normalize;
        p.y *= normalize;
    }

    
    float t = clamp(length(p), 0.0, 1.0);

    
    t = mix(t, 1.0 - t, u_invert_mask);
    
    
    float mask = pow(smoothstep(0.0, 1.0, t), max(u_falloff, 1e-6));

    return mask;
}

void main() {
  vec2 uv = v_texCoord;

    
    if (u_debug_mask > 0.5) {
        float m = radialMask(uv);
        outColor = vec4(vec3(m), 1.0);
        return;
    }

    
    if (u_debug_aperture > 0.5) {
        outColor = vec4(debugApertureFootprint(uv), 1.0);
        return;
    }

    float a = 150.0;                 
    float m = radialMask(uv);        
    float blurRadius = u_max_radius * m; 

    
    vec3 linearColor = Bokeh(u_texture, uv, blurRadius, a);
    vec3 srgbColor = linearToSrgb(linearColor);

    outColor = vec4(srgbColor, texture(u_texture, uv).a);
}
`;
