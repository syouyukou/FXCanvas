



// @gips_version=1

uniform vec2 input_levels;    // value=(0.0, 1.0), desc=input min/max
uniform float midpoint;     // value=1, min=.2, max=5
uniform vec2 output_levels;   // value=(0, 1), desc=output min/max
uniform float affect_luma_only;  // ui=switch, desc=luminance only

vec3 run(vec3 rgb) {
    if (affect_luma_only < 0.5) {
        
        rgb = (rgb - input_levels.x) / (input_levels.y - input_levels.x);
        rgb = pow(clamp(rgb, 0.0, 1.0), vec3(1.0 / midpoint));
        return rgb * (output_levels.y - output_levels.x) + output_levels.x;
    } else {
        
        float luma = dot(rgb, vec3(.25, .5, .25));
        vec3 chroma = rgb - vec3(luma);
        luma = (luma - input_levels.x) / (input_levels.y - input_levels.x);
        luma = pow(clamp(luma, 0.0, 1.0), 1.0 / midpoint);
        luma = luma * (output_levels.y - output_levels.x) + output_levels.x;
        return vec3(luma) + chroma;
    }
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = fragCoord / iResolution.xy;
    vec4 tex = texture(iChannel0, uv);

    vec3 rgb = (tex.a < 0.01) ? tex.rgb : run(tex.rgb);
    fragColor = vec4(rgb, tex.a);
}
