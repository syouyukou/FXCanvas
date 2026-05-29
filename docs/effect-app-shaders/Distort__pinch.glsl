



// @gips_version=1 @coord=rel

const vec2 offset = vec2(0.0, 0.0);
const vec2 texScale = vec2(1.0, 1.0);

uniform float strength;  // value=0.4, min=-1
uniform float radius;    // value=1.5, min=0.01, max=2
uniform vec2 center;    // value=(0.1, 0.), min=-2, max=2

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

vec4 run(vec2 pos) {
    pos -= center;
    float oldDist = length(pos);
    float d = oldDist / radius;
    float u = 1.0 - strength;
    if (d < 1.0) {
        d = d * (u + d * (2.0 - 2.0 * u + d * (u - 1.0)));
    }
    d *= radius;
    pos *= d / oldDist;
    pos += center;
    return pixel(pos);
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = toRelCoord(fragCoord);
    fragColor = run(uv);
}
