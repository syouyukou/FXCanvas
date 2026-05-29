



// @gips_version=1 @coord=rel @filter=on

const vec2 offset = vec2(0.0, 0.0);
const vec2 texScale = vec2(1.0, 1.0);

uniform vec2 centerI;    // label=input center, min=-2, max=2, desc=input center
uniform vec2 centerO;    // label=output center, min=-2, max=2, desc=output center
uniform float scale;      // label=scale amount, value=0.39, min=-3, max=3, desc=scale (logarithmic)
uniform float rot;        // label=rotation, max=360, step=1, desc=output rotation
uniform float axes;       // label=symmetry axes, value=5, max=16, step=1, desc=mirror axes
uniform float angle;      // label=axis angle, max=360, step=1, desc=axis angle
uniform vec3 bg;         // label=background color, ui=color, desc=background color
uniform float bgOpacity;  // label=background opacity, desc=background color opacity

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

vec2 mirror(vec2 p, float a) {
    float c = cos(a);
    float s = sin(a);
    p *= mat2(c, s, -s, c);
    p.x = abs(p.x);
    p *= mat2(c, -s, s, c);
    return p;
}

vec4 run(vec2 pos) {
    
    float s = exp2(-scale);
    float c = s * cos(radians(rot));
          s = s * sin(radians(rot));
    pos = (pos - centerO) * mat2(c, s, -s, c);
    for (float ax = 0.5;  ax < axes;  ax += 1.0) {
        pos = mirror(pos, radians(angle) + (ax - 0.5) * 3.14159 / axes);
    }
    vec4 fg = pixel(pos + centerI);

    
    float outside = max(
        abs(pos.x) - max(1.0, iResolution.x / iResolution.y),
        abs(pos.y) - max(1.0, iResolution.y / iResolution.x)
    );
    fg.a *= 1.0 - smoothstep(0.0, fwidth(outside), outside);

    
    float bga = bgOpacity * (1.0 - fg.a);
    fg.rgb = fg.rgb * fg.a + bg * bga;
    fg.a += bga;
    return vec4(fg.rgb / fg.a, fg.a);
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = toRelCoord(fragCoord);
    fragColor = run(uv);
}
