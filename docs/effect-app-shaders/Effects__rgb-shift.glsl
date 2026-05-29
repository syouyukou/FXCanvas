



// @gips_version=1 @coord=rel @filter=on

const vec2 offset = vec2(0.0, 0.0);
const vec2 texScale = vec2(1.0, 1.0);

uniform float red;     // label=red offset, value=0.2, min=-0.2, max=0.2, step=0.001, desc=red/cyan strength
uniform float blue;    // label=blue offset, value=0.2, min=-0.2, max=0.2, step=0.001, desc=blue/yellow strength
uniform float aspect;  // label=stretch ratio, value=1.3, min=-2, max=2, desc=R/B aspect ratio
uniform vec2 center;  // label=aberration center, value=(-1., 0.), min=-1, max=1

vec2 toRelCoord(vec2 coords) {
    float aspect = iResolution.x / iResolution.y;
    vec2 increaseLongSide = aspect > 1.0 ? vec2(aspect, 1.0) : vec2(1.0, 1.0 / aspect);
    return ((coords / iResolution.xy) * 2.0 - 1.0) * increaseLongSide;
}

vec2 fromRelCoord(vec2 coords) {
    float aspect = iResolution.x / iResolution.y;
    vec2 increaseLongSide = aspect > 1.0 ? vec2(aspect, 1.0) : vec2(1.0, 1.0 / aspect);
    return ((coords / increaseLongSide) + 1.0) / 2.0;
}

vec4 pixel(in vec2 pos) {
    vec2 uv = fromRelCoord(pos);
    uv = offset + uv * texScale;
    return textureLod(iChannel0, uv, 0.0);
}

vec4 sampleCA(vec2 pos, float strength) {
    vec2 dir = (pos - center) * vec2(exp(aspect), exp(-aspect));
    return pixel(pos + dir * strength);
}

vec4 run(vec2 pos) {
    vec4 g = pixel(pos);
    return vec4(sampleCA(pos, red / 10.0).r, g.g, sampleCA(pos, blue / 10.0).b, g.a);
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = toRelCoord(fragCoord);
    fragColor = run(uv);
}
