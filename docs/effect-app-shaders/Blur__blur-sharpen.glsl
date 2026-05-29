



// @gips_version=1 @coord=none @filter=off

const vec2 offset = vec2(0.0, 0.0);
const vec2 texScale = vec2(1.0, 1.0);

uniform float blurriness;  // value=-5, min=-5, max=1
uniform float threshold;   // value=1, step=0.001
uniform float ringing;     // value=0.2, desc=ringing allowed

vec4 pixel(in vec2 pos) {
    vec2 uv = offset + pos * texScale;
    return textureLod(iChannel0, uv, 0.0);
}

vec4 run(vec2 pos) {
    vec3 p00 = textureLodOffset(iChannel0, pos, 0.0, ivec2(-1,-1)).rgb;
    vec3 p10 = textureLodOffset(iChannel0, pos, 0.0, ivec2( 0,-1)).rgb;
    vec3 p20 = textureLodOffset(iChannel0, pos, 0.0, ivec2( 1,-1)).rgb;
    vec3 p01 = textureLodOffset(iChannel0, pos, 0.0, ivec2(-1, 0)).rgb;
    vec4 p11 = pixel(pos);
    vec3 p21 = textureLodOffset(iChannel0, pos, 0.0, ivec2( 1, 0)).rgb;
    vec3 p02 = textureLodOffset(iChannel0, pos, 0.0, ivec2(-1, 1)).rgb;
    vec3 p12 = textureLodOffset(iChannel0, pos, 0.0, ivec2( 0, 1)).rgb;
    vec3 p22 = textureLodOffset(iChannel0, pos, 0.0, ivec2( 1, 1)).rgb;
    vec3 res = 0.25 * p11.rgb + 0.125 * (p01 + p10 + p12 + p21) + 0.0625 * (p00 + p02 + p20 + p22);
    res = mix(p11.rgb, res, blurriness);
    res = mix(p11.rgb, res, lessThan(abs(res - p11.rgb), vec3(threshold)));
    if ((ringing < 1.0) && (blurriness < 0.0)) {
        vec3 vmin = min(min(min(min(p00, p22), min(p20, p02)), min(min(p01, p10), min(p21, p12))), p11.rgb);
        vec3 vmax = max(max(max(max(p00, p22), max(p20, p02)), max(max(p01, p10), max(p21, p12))), p11.rgb);
        res = mix(min(max(res, vmin), vmax), res, ringing);
    }
    return vec4(res, p11.a);
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = fragCoord / iResolution.xy;
    fragColor = run(uv);
}
