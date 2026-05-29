



// @gips_version=1 @coords=rel @filter=on

const vec2 offset = vec2(0.0, 0.0);
const vec2 texScale = vec2(1.0, 1.0);

uniform float zoom;               // label=camera zoom, value=0.17, min=-5, max=5, desc=camera zoom (logarithmic)
uniform float fov;               // label=field of view, value=60, min=10, max=170, desc=camera field of view in degrees
uniform vec2 camPos;             // label=camera position, min=-2, max=2, desc=camera offset
uniform vec3 rotation;           // label=(rotate X, rotate Y, rotate Z), value=(-25.0, 0., 0.), min=-90, max=90, desc=plane rotation
uniform vec3 background;         // label=background color, ui=color, desc=background color
uniform float backgroundOpacity;  // label=background opacity, desc=background color opacity
uniform float zAlpha;             // label=depth-based alpha, ui=switch, desc=map depth to alpha
uniform float zKey;               // label=depth key value, value=-0.79, min=-3, max=3, desc=depth offset
uniform float zRange;             // label=depth range, value=1.89, max=3, desc=depth range
uniform float zInvert;            // label=invert depth, value=1, ui=switch, desc=invert depth-alpha

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
    
    mat3 tbn = mat3(1., 0., 0.,
                    0., 1., 0.,
                    0., 0.,-1.);

    
    vec3 a = radians(rotation);
    float s, c;
    s = sin(a.y), c = cos(a.y);
    tbn = tbn * mat3( c,0., s,
                     0.,1.,0.,
                     -s,0., c);
    s = sin(a.x), c = cos(a.x);
    tbn = tbn * mat3(1.,0.,0.,
                     0., c,-s,
                     0., s, c);
    s = sin(a.z), c = cos(a.z);
    tbn = tbn * mat3( c,-s,0.,
                      s, c,0.,
                     0.,0.,1.);

    
    float fovFactor = 1.0 / tan(radians(fov) * 0.5);
    vec3 d = normalize(vec3(pos, fovFactor));

    
    vec3 o = vec3(camPos, -1.0);
    vec3 hit = o - d * dot(o, tbn[2]) / dot(tbn[2], d);

    
    vec2 uv = vec2(dot(hit, tbn[0]), dot(hit, tbn[1])) * exp(-zoom);

    
    float outside = max(
        abs(uv.x) - max(1.0, iResolution.x / iResolution.y),
        abs(uv.y) - max(1.0, iResolution.y / iResolution.x)
    );
    outside = smoothstep(0.0, fwidth(outside), outside);

    
    vec4 color = pixel(uv);
    color = vec4(mix(color.rgb, mix(background, color.rgb, (1.0 - backgroundOpacity) * (1.0 - outside)), outside), mix(color.a, backgroundOpacity, outside));

    
    if (zAlpha > 0.5) {
        color.a *= abs(zInvert - smoothstep(0.0, 1.0, abs(hit.z - zKey) / zRange));
    }

    return color;
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = toRelCoord(fragCoord);
    fragColor = run(uv);
}
