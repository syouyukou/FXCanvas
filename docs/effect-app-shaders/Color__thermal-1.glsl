


// @gips_version=1

uniform float invert;     // value=1.0, ui=switch, min=0.0, max=1.0, step=1.0, desc=invert gradient
uniform float shadows;    // value=-0.5, min=-0.5, max=0.5, step=0.01, desc=shadows adjustment
uniform float midtones;   // value=-0.22, min=-0.5, max=0.5, step=0.01, desc=midtones adjustment
uniform float highlights; // value=-0.05, min=-0.5, max=0.5, step=0.01, desc=highlights adjustment

#define sat(x) clamp(x, 0.0, 1.0)


float tcCatmullRom(float x, float v0, float v1, float v2, float v3) {
    float c2 = -0.5 * v0 + 0.5 * v2;
    float c3 = v0 - 2.5 * v1 + 2.0 * v2 - 0.5 * v3;
    float c4 = -0.5 * v0 + 1.5 * v1 - 1.5 * v2 + 0.5 * v3;
    return (((c4 * x + c3) * x + c2) * x + v1);
}


float threePointToneCurve(float col, float shadows, float midtones, float highlights) {
    float V0 = -0.5  + shadows;
    float V1 =  0.0  + shadows;
    float V2 =  0.5  + midtones;
    float V3 =  1.0  + highlights;
    float V4 =  1.5  + highlights;

    if (col < 0.5)
        return tcCatmullRom(col * 2.0, V0, V1, V2, V3);
    else
        return tcCatmullRom((col - 0.5) * 2.0, V1, V2, V3, V4);
}

vec3 run(vec3 rgb) {
    
    float luma = dot(rgb, vec3(0.2126, 0.7152, 0.0722));

    
    if (invert > 0.5) {
        luma = 1.0 - luma;
    }

    
    float curvedLuma = threePointToneCurve(luma, shadows, midtones, highlights);
    curvedLuma = sat(curvedLuma);

    
    return vec3(curvedLuma);
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = fragCoord / iResolution.xy;
    vec4 tex = texture(iChannel0, uv);

    
    vec3 rgb = (tex.a < 0.01) ? tex.rgb : run(tex.rgb);
    fragColor = vec4(rgb, tex.a);
}
