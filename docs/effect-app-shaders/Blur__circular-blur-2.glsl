



// @gips_version=1 @coord=pixel @filter=on

const vec2 offset = vec2(0.0, 0.0);
const vec2 texScale = vec2(1.0, 1.0);

uniform float radius;  // value=54, max=100
uniform float N;       // label=repetitions, value=8, min=3, max=23, step=1, desc=sample count
uniform float passes;  // value=1, min=1, max=4, step=1, desc=pass count
uniform float decay;   // value=.4, desc=pass decay


vec4 pixel(in vec2 pos) {
    vec2 uv = offset + pos * texScale / iResolution.xy;
    return textureLod(iChannel0, uv, 0.0);
}

vec4 run_main(vec2 xy, float r, float phase) {
    float alpha = pixel(xy).a;
    r *= max(1.0, alpha);
    vec3 accum = vec3(0.0);
    for (float i = phase;  i < N;  i += 1.0) {
        float a = i * (6.28318530717959 / N);
        accum += pixel(xy + r * vec2(cos(a), sin(a))).rgb;
    }
    return vec4(accum / N, alpha);
}

vec4 run(vec2 pos) {
    return (passes > 1.5) ? run_main(pos, radius * decay, 0.618) : pixel(pos);
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    fragColor = run(fragCoord);
}
