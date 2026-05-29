
#define PI 3.14159265


uniform float TC; // label=wave scale, value=100.0, min=10.0, max=500.0, step=5.0, desc=controls the frequency of the carrier wave
uniform float KF; // label=FM sensitivity, value=0.4, min=0.1, max=1.0, step=0.05, desc=how much the input signal modulates the frequency
uniform float AM; // label=signal strength, value=1.0, min=0.1, max=2.0, step=0.1, desc=amplitude of the modulating signal
uniform float waveDirection; // label=wave direction, value=0, min=0, max=3, step=1, desc=0=left-to-right, 1=top-to-bottom, 2=right-to-left, 3=bottom-to-top


uniform float modulateRed;   // label=red channel, value=1, ui=switch, desc=enable modulation for red channel
uniform float modulateGreen; // label=green channel, value=1, ui=switch, desc=enable modulation for green channel
uniform float modulateBlue;  // label=blue channel, value=1, ui=switch, desc=enable modulation for blue channel

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    
    vec3 channelMask = vec3(modulateRed, modulateGreen, modulateBlue);

    
    if (dot(channelMask, vec3(1.0)) == 0.0) {
        fragColor = vec4(0.0, 0.0, 0.0, 1.0);
        return;
    }

    
    
    vec3 col = texture(iChannel0, fragCoord/iResolution.xy).rgb;
    vec3 prevCol;

    int dir = int(waveDirection);
    if (dir == 0) { 
        prevCol = texture(iChannel0, (fragCoord-vec2(1.0, 0.0))/iResolution.xy).rgb;
    } else if (dir == 1) { 
        prevCol = texture(iChannel0, (fragCoord-vec2(0.0, 1.0))/iResolution.xy).rgb;
    } else if (dir == 2) { 
        prevCol = texture(iChannel0, (fragCoord+vec2(1.0, 0.0))/iResolution.xy).rgb;
    } else if (dir == 3) { 
        prevCol = texture(iChannel0, (fragCoord+vec2(0.0, 1.0))/iResolution.xy).rgb;
    }

    vec3 demodulated = abs(col - prevCol);

    
    
    col = demodulated * channelMask;

    fragColor = vec4(col, 1.0);
}
