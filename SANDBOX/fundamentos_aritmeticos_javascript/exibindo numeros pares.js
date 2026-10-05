/*Desafios
Crie um programa que leia um número e mostre os números pares até esse número, inclusive ele mesmo.

Entrada
Você receberá 1 valor inteiro N, onde N > 0.

Saída
Exiba todos os números pares até o valor de entrada, sendo um em cada linha. */



let n = parseInt(gets());
let contador = 1;

while (contador <= n) {
  contador % 2 === 0 && console.log(contador);
  contador++;
}