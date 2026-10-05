/*Desafio
Faça a leitura de um valor inteiro. Em seguida, calcule o menor número de notas possíveis (cédulas) onde o valor pode ser decomposto. As notas que você deve considerar são de 100, 50, 20, 10, 5, 2 e 1. Na sequência mostre o valor lido e a relação de notas necessárias.

Entrada
Você receberá um valor inteiro N (0 < N < 1000000).

Saída
Exiba o valor lido e a quantidade mínima de notas de cada tipo necessárias, seguindo o exemplo de saída abaixo. Após cada linha deve ser imprimido o fim de linha.*/



var notas = [100, 50, 20, 10, 5, 2, 1];
var valorPago = parseInt(gets());
console.log(valorPago);

for (var x = 0; x < notas.length; x++) {
    if (valorPago >= notas[x]) {
        var div = Math.floor(valorPago / notas[x]);
        mensagem = div + " nota(s) de R$ " + parseFloat(notas[x]).toFixed(2);
        valorPago -= div * notas[x];
        console.log(mensagem.toString().replace(".", ","));
    } else {
        div = 0;
        mensagem = div + " nota(s) de R$ " + parseFloat(notas[x]).toFixed(2);
        console.log(mensagem.toString().replace(".", ","));
    }
}