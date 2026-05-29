



// @gips_version=1

uniform float hue_rotation;    // value=262, max=360, step=1
uniform float saturation;  // value=1, max=5
uniform float invert_colors;      // ui=switch, desc=invert luminance
uniform float preserve_lightness;        // value=1, ui=switch, off=-1, desc=invert chrominance

vec3 run(vec3 rgb) {
    float luma = dot(rgb, vec3(.299, .587, .114));
    vec3 chroma = rgb - vec3(luma);
    float hue = radians(hue_rotation);

    
    float s = sqrt(1.0/3.0) * sin(hue), c = cos(hue), b = (1.0/3.0) * (1.0 - c);
    chroma = mat3(b+c, b-s, b+s,
                  b+s, b+c, b-s,
                  b-s, b+s, b+c) * chroma;

    if (invert_colors > 0.5) { luma = 1.0 - luma; }
    return vec3(luma) + chroma * saturation * preserve_lightness;
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = fragCoord / iResolution.xy;
    vec4 tex = texture(iChannel0, uv);

    vec3 rgb = (tex.a < 0.01) ? tex.rgb : run(tex.rgb);
    fragColor = vec4(rgb, tex.a);
}
