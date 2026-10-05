/*Desafio
Desenvolva um código que leia um valor E. Este E será o tamanho de um vetor X[E]. 
A seguir, leia cada um dos valores de X, encontre o menor elemento deste vetor e a sua posição dentro do vetor, mostrando esta informação.

Entrada
A primeira linha de entrada contem um único inteiro E (1 < E < 1000), indicando o número de elementos que deverão ser 
lidos em seguida para o vetor X[E] de inteiros. A segunda linha contém cada um dos E valores, separados por um espaço.

Saída
A primeira linha apresenta a mensagem “Menor valor:” seguida de um espaço e do menor valor lido na entrada. 
A segunda linha apresenta a mensagem “Posicao:” seguido de um espaço e da posição do vetor na qual se encontra o menor valor lido, 
lembrando que o vetor inicia na posição zero.

 
Exemplo de Entrada:
10
1 2 3 4 -5 6 7 8 9 10

Exemplo de Saída:
Menor valor: -5
Posicao: 4
*/



let e = gets() // Quantidade de números
let array = gets()
let values = array.replace(/\s/g,',').trim().split(',');
// .trim() - Remove espaços em brancos
// .replace() - altera o valor
// /\s/g - É uma expressão, onde \s significa "match whitespace"
// e 'g' é uma flag que significa "global"

let min = values[0]
let position = 0

for (let i = 0; i < e; i++){
  if(parseFloat(min) > parseFloat(values[i])){
    min = values[i]
    position = i
  }
}

console.log('Menor valor: ' + min)

console.log('Posicao: ' + position)
