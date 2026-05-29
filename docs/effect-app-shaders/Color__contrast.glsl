



// @gips_version=1

uniform float contrast_strength ;   // value=0.2, step=0.1, min=-2, max=2, desc=contrast adjustment
uniform float pivot_point;  // value=0.5, desc=mean brightness
uniform float output_mapping;   // value=1, desc=gamut mapping
uniform float gamma;  // value=2.2, min=0.2, max=5, desc=working gamma

vec3 run(vec3 rgb) {
    float exponent = -log2(pivot_point);
    float contrast = exp2(contrast_strength);

    rgb = pow(rgb, vec3(gamma));
    float origLuma = dot(rgb, vec3(0.25, 0.5, 0.25));

    float newLuma = pow(origLuma, 1.0 / exponent);
    bool upper = (newLuma > 0.5);
    if (upper) { newLuma = 1.0 - newLuma; }
    newLuma = 0.5 * pow(2.0 * newLuma, contrast);
    if (upper) { newLuma = 1.0 - newLuma; }
    newLuma = pow(newLuma, exponent);

    rgb *= newLuma / origLuma;
    float minRGB = min(min(rgb.r, rgb.g), rgb.b);
    float maxRGB = max(max(rgb.r, rgb.g), rgb.b);
    if ((maxRGB > 1.0) && (minRGB < maxRGB)) {
        rgb = mix(rgb, vec3(minRGB) + (rgb - vec3(minRGB)) * vec3((1.0 - minRGB) / (maxRGB - minRGB)), output_mapping);
    }

    return pow(rgb, vec3(1.0 / gamma));
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = fragCoord / iResolution.xy;
    vec4 tex = texture(iChannel0, uv);

    vec3 rgb = (tex.a < 0.01) ? tex.rgb : run(tex.rgb);
    fragColor = vec4(rgb, tex.a);
}
