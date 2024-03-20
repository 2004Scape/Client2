#version 300 es

precision highp float;
precision highp sampler2D;

uniform sampler2D tex;

in vec2 TexCoord;

out vec4 FragColor;

void main() {
  vec4 c = texture(tex, TexCoord);
  FragColor = c;
}