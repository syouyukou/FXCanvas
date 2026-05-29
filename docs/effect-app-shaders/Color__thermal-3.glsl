


// @gips_version=1

uniform float show_edges;       // value=1.0, ui=switch, min=0.0, max=1.0, step=1.0, desc=show edge overlay
uniform float edge_range;       // value=0.5, min=0.15, max=2.0, step=0.01, desc=edge detection sensitivity

#define sat(x) clamp(x, 0.0, 1.0)

vec3 run(vec2 uv) {
    vec4 center = texture(iChannel0, uv);

    
    if (show_edges < 0.5 || center.a < 0.01) {
        return center.rgb;
    }

    
    
    vec2 texelSize = 1.0 / iResolution.xy;
    float offset = 0.5; 

    vec3 p00 = texture(iChannel7, uv + vec2(-offset, -offset) * texelSize).rgb;
    vec3 p10 = texture(iChannel7, uv + vec2(     0.0, -offset) * texelSize).rgb;
    vec3 p20 = texture(iChannel7, uv + vec2( offset, -offset) * texelSize).rgb;
    vec3 p01 = texture(iChannel7, uv + vec2(-offset,      0.0) * texelSize).rgb;
    vec3 p21 = texture(iChannel7, uv + vec2( offset,      0.0) * texelSize).rgb;
    vec3 p02 = texture(iChannel7, uv + vec2(-offset,  offset) * texelSize).rgb;
    vec3 p12 = texture(iChannel7, uv + vec2(     0.0,  offset) * texelSize).rgb;
    vec3 p22 = texture(iChannel7, uv + vec2( offset,  offset) * texelSize).rgb;

    
    vec3 Gv = p00 - p02 + 2.0 * (p10 - p12) + p20 - p22;
    vec3 Gh = p00 - p20 + 2.0 * (p01 - p21) + p02 - p22;
    vec3 G = sqrt(Gv * Gv + Gh * Gh);

    
    float edgeStrength = max(G.r, max(G.g, G.b));
    float edge = sat(edgeStrength / edge_range);

    
    vec3 edgeColor = vec3(1.0, 1.0, 1.0);
    float edgeOpacity = 0.2;
    vec3 result = mix(center.rgb, edgeColor, edge * edgeOpacity);

    return result;
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = fragCoord / iResolution.xy;
    vec4 tex = texture(iChannel0, uv);

    vec3 rgb = run(uv);
    fragColor = vec4(rgb, tex.a);
}
