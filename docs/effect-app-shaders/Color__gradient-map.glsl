uniform float d_debugGradient;   // ui=gradient, label="Gradient map"
uniform float gradientShift;     // label="Gradient shift", value=0.0, min=-1.0, max=1.0, random=0 
uniform float gradientRepeat;    // label="Gradient repeat", value=1.0, min=1.0, max=8.0, step=1.0, random=0

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = fragCoord / iResolution.xy;

    vec4 base = texture(iChannel0, uv);

    
    float luminance = dot(base.rgb, vec3(0.2126, 0.7152, 0.0722));

    
    float repeats = max(1.0, gradientRepeat);
    float rawT = luminance * repeats + gradientShift;
    float t = rawT - floor(rawT);
    
    
    if (t < 0.001 && rawT > 0.001) t = 1.0;

    
    vec4 gradientColor = texture(iChannel5, vec2(t, 0.5));

    fragColor = gradientColor;
}
