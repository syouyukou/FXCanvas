
#define PI 3.14159265


uniform float TC; // label=wave scale, value=420.0, min=10.0, max=500.0, step=5.0, desc=controls the frequency of the carrier wave
uniform float KF; // label=FM sensitivity, value=0.25, min=0.1, max=1.0, step=0.05, desc=how much the input signal modulates the frequency
uniform float AM; // label=signal strength, value=0.2, min=0.1, max=20.0, step=0.1, desc=amplitude of the modulating signal
uniform float waveDirection; // label=wave direction, value=0, min=0, max=3, step=1, desc=0=left-to-right, 1=top-to-bottom, 2=right-to-left, 3=bottom-to-top
const float AC = 0.5; 


uniform float modulateRed;   // label=red channel, value=1, ui=switch, desc=enable modulation for red channel
uniform float modulateGreen; // label=green channel, value=1, ui=switch, desc=enable modulation for green channel
uniform float modulateBlue;  // label=blue channel, value=1, ui=switch, desc=enable modulation for blue channel

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    
    vec3 originalCol = texture(iChannel0, fragCoord.xy/iResolution.xy).rgb;

    
    vec3 channelMask = vec3(modulateRed, modulateGreen, modulateBlue);

    
    if (dot(channelMask, vec3(1.0)) == 0.0) {
        fragColor = vec4(0.0, 0.0, 0.0, 1.0);
        return;
    }

    
    vec3 col = vec3(0.0);
    float wavePos = 0.0;

    int dir = int(waveDirection);
    if (dir == 0) { 
        for(float x = 0.0; x < fragCoord.x; x += 1.0) {
            col += texture(iChannel0, vec2(x, fragCoord.y)/iResolution.xy).rgb;
        }
        wavePos = fragCoord.x;
    } else if (dir == 1) { 
        for(float y = 0.0; y < fragCoord.y; y += 1.0) {
            col += texture(iChannel0, vec2(fragCoord.x, y)/iResolution.xy).rgb;
        }
        wavePos = fragCoord.y;
    } else if (dir == 2) { 
        for(float x = iResolution.x; x > fragCoord.x; x -= 1.0) {
            col += texture(iChannel0, vec2(x, fragCoord.y)/iResolution.xy).rgb;
        }
        wavePos = iResolution.x - fragCoord.x;
    } else if (dir == 3) { 
        for(float y = iResolution.y; y > fragCoord.y; y -= 1.0) {
            col += texture(iChannel0, vec2(fragCoord.x, y)/iResolution.xy).rgb;
        }
        wavePos = iResolution.y - fragCoord.y;
    }

    
    
    vec3 modulatedCol = 0.5 + AC * cos(2.0*PI*(wavePos/TC+KF*AM*col));

    
    
    float q = 2.0;
    modulatedCol = floor(modulatedCol*(q-1.0)+0.5)/(q-1.0);

    
    
    col = modulatedCol * channelMask;

    
    fragColor = vec4(col,1.0);
}
