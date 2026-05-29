// @feedback channel=2



uniform float threshold;        // label=threshold, value=0.75, min=0.0, max=4.0, step=0.01
uniform float knee;             // value=0.12, min=0.0, max=2.0, step=0.01
uniform float dimming;          // label=dimming, value=0.06, min=0.0, max=0.5, step=0.001, desc=fades accumulated motion trails each frame
uniform vec2 direction_shift;   // label=direction, value=(0.0, -2.0), min=-4.0, max=4.0, step=0.1, desc=per-frame drift in pixels
uniform float shake_amount;     // label=shake, value=0.15, min=0.0, max=5.0, step=0.01
uniform float shake_speed;      // label=shake speed, value=5.0, min=0.0, max=10.0, step=0.01

vec3 sRGBToLinear(vec3 col) {
    bvec3 cutoff = lessThanEqual(col, vec3(0.04045));
    vec3 lower = col / 12.92;
    vec3 higher = pow((col + 0.055) / 1.055, vec3(2.4));
    return mix(higher, lower, vec3(cutoff));
}

vec3 linearToSRGB(vec3 col) {
    col = max(col, vec3(0.0));
    bvec3 cutoff = lessThanEqual(col, vec3(0.0031308));
    vec3 lower = col * 12.92;
    vec3 higher = 1.055 * pow(col, vec3(1.0 / 2.4)) - 0.055;
    return mix(higher, lower, vec3(cutoff));
}

float luminance(vec3 col) {
    return dot(col, vec3(0.2126729, 0.7151522, 0.0721750));
}

vec2 mirrorWrap(vec2 uv) {
    uv = abs(uv);
    uv = uv - 2.0 * floor(uv * 0.5);
    return vec2(uv.x > 1.0 ? 2.0 - uv.x : uv.x, uv.y > 1.0 ? 2.0 - uv.y : uv.y);
}

vec3 extractHighlights(vec3 colLin) {
    float safeKnee = max(knee, 1e-5);
    float y = luminance(colLin);
    float x = max(y - (threshold - safeKnee), 0.0);
    float soft = (x * x) / (4.0 * safeKnee + x + 1e-6);
    float hard = max(y - threshold, 0.0);
    float mask = clamp(max(soft, hard), 0.0, 1.0);
    return colLin * mask;
}

vec2 animatedShakePx() {
    float t = iTime * shake_speed;
    return vec2(
        sin(t * 1.37) + 0.5 * sin(t * 2.41 + 1.7),
        cos(t * 1.91 + 0.8) + 0.5 * cos(t * 2.73 + 2.4)
    ) * shake_amount;
}

vec3 screenBlend(vec3 base, vec3 blend) {
    return 1.0 - (1.0 - base) * (1.0 - blend);
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = fragCoord / iResolution.xy;
    vec2 px = 1.0 / iResolution.xy;

    vec3 sourceLin = sRGBToLinear(texture(iChannel0, uv).rgb);
    vec3 extracted = clamp(extractHighlights(sourceLin), 0.0, 1.0);

    vec2 driftPx = direction_shift + animatedShakePx();
    vec2 sampleUV = mirrorWrap(uv - driftPx * px);
    vec3 previous = sRGBToLinear(texture(iChannel2, sampleUV).rgb);
    previous *= max(0.0, 1.0 - dimming);

    vec3 motionTrails = screenBlend(previous, extracted);
    fragColor = vec4(linearToSRGB(clamp(motionTrails, 0.0, 1.0)), 1.0);
}
