



// @gips_version=1 @coord=pixel @filter=off



const vec2 offset = vec2(0.0, 0.0);
const vec2 texScale = vec2(1.0, 1.0);

uniform float strength;   // value=14, min=.3, max=50, step=0.01
uniform float aspect;  // value=0, min=-2.0, max=2.0

vec4 pixel(in vec2 pos) {
    vec2 uv = offset + pos * texScale / iResolution.xy;
    return textureLod(iChannel0, uv, 0.0);
}

vec4 run_main(vec2 pos, vec2 dir, float radius) {
    vec4 color = pixel(pos);
    float wsum = 0.5;
    radius *= max(1.0, color.a);
    for (float dist = 1.0;  dist < radius;  dist += 1.0) {
        float w = 1.0 - dist / radius;
        w = 1.0 - w * w;
        w = 1.0 - w * w;
        color.rgb += w * (pixel(pos - dist * dir).rgb + pixel(pos + dist * dir).rgb);
        wsum += w;
    }
    return vec4(color.rgb / (wsum * 2.0), color.a);
}

vec4 run(vec2 pos) {
    return run_main(pos, vec2(0.0, 1.0), strength * 2.6412 * exp(-aspect));
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    fragColor = run(fragCoord);
}
