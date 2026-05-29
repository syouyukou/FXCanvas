



// @gips_version=1 @coord=rel @filter=on



const vec2 offset = vec2(0.0, 0.0);
const vec2 texScale = vec2(1.0, 1.0);

uniform vec2 center;    // value=(0., -0.5), min=-2, max=2
uniform float angle;    // value=16, max=90, step=1
uniform float samples;  // value=45, min=1, max=100, step=1, desc=sample count (quality)
uniform float box;      // value=0, ui=switch, desc=box blur (instead of Gaussian)

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
    vec4 color = vec4(0.0);
    float wsum = 0.0;
    pos -= center;
    for (float i = -samples;  i <= samples;  i += 1.0) {
        float dist = i / samples;
        float w = 1.0 - dist;
        w = 1.0 - w * w;
        w = 1.0 - w * w;
        w = max(w, box);

        float a = radians(angle) * dist, c = cos(a), s = sin(a);
        color += w * pixel(mat2(c,-s,s,c) * pos + center);
        wsum += w;
    }
    return color / wsum;
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = toRelCoord(fragCoord);
    fragColor = run(uv);
}
