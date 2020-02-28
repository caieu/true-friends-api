# Passo a passo: Servidor MongoDB para a rede social TrueFriends

## Criando o projeto

- Instale, configure o mongodb em sua máquina.
[Link para guia de instalação do MongoDB](https://docs.mongodb.com/manual/installation/)
- Inicie o serviço do mongo:
 `sudo service mongod start`
- Crie uma pasta com o nome do projeto:
 `mkdir nome-do-projeto`
- Entre na pasta:
 `cd nome-do-projeto`
- Inicialize o projeto com node (deixe tudo default mesmo):
 `npm init`  
- Instalar os pacotes `express`, `body-parser`, `cors`, `validator`, `dotenv`, `mongodb` e `mongoose`:
 `npm install --save express body-parser cors validator dotenv mongodb mongoose`
- Crie um arquivo `.env` na raiz do projeto, e coloque as variáveis `DB_CONNECTION` com o endereço do banco mongodb, e `TOKEN_SECRET`, um MD5 único para geração de tokens.
- Crie a pasta `src` dentro do projeto.
- Crie o arquivo `index.js`.

## Iniciando o servidor

- No arquivo `index.js` precisamos iniciar o servidor com o `express`. Para isso, vamos importar o `express`. Depois, vamos criar uma variavel `app` com o express, e escutar uma porta no final:

```javascript
const express = require("express");
const app = express();
app.listen(3000, () => {
    console.log("Escutando na porta 3000");
});
````

- Precisamos adicionar os middlewares `body-parser` e `cors`:

````javascript
app.use(bodyParser.json());
app.use(cors());
````

## Iniciando o banco de dados

- Crie a pasta `database` em `src` com o arquivo `index.js`.
- Esse arquivo vai connectar o nosso projeto com o mongodb. Você deve importar o `mongoose`, e usar a função connect para connectar o mongoose no banco de dados. Lembre-se de passar como parâmetro um objeto com o `useNewUrlParser` com valor `true`.

````javascript
const mongoose = require("mongoose");
mongoose.connect("mongodb://localhost/dbname", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true
});
module.exports = mongoose;
````

## Criando modelos

- Para criar um modelo, primeiramente precisamos criar um Schema. Defina o nome do schema que é basicamente o nome do objeto que voce vai guardar no banco, como por exemplo, User.
- Para isso, devemos importar o mongoose e usar um `const User = new mongoose.Schema({OBEJTO QUE DEFINE O SCHEMA})`.
- Depois precisamos criar o model usando o schema que foi criado anteriormente.
- Por fim, exportamos o model criado.

````javascript
const mongoose = require("mongoose");
const validator = require("validator");

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, "invalid email"]
  },
  password: {
    type: String,
    required: true,
    select: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const User = mongoose.model("User", UserSchema);

module.exports = User;
````

## Criando rotas

- Agora precisamos criar as rotas para o nosso servidor.
- Crie uma pasta chamada `routes` em `src`. Dentro dela, você deve criar um arquivo para cada rota que planeja criar.
- No arquivo da rota, devemos importar o `express`, e criar um `Router` do `express`. Nos vamos usar esse `Router` para criar as chamadas rest que precisarmos.
- Crie as chamadas necessárias, sempre lembrando de criar uma chamada async, que recebe um req e um res como parametros.
- Ao final, exporte o router.

````javascript
const express = require("express");
const User = require("../models/user");

const router = express.Router();

router.post("/register", async (req, res) => {
  try {
    const user = await User.create(req.body);
    res.send({ user });
  } catch (err) {
    return res
      .status(400)
      .send({ message: "Registration failed.", error: err });
  }
});

module.exports = router;
````

- Por ultimo, devemos adicionar ao index.js da aplicacao o router que foi criado.
- Em `index.js`, importe o router e use-o com o nome da rota escolhida.

````javascript
//Routes
const authRoutes = require("./routes/auth");

app.use("/auth", authRoutes);
````

## Criando relações

- Ao guardar um documento de uma coleção no banco, podemos criar relação com outra coleção, como por exemplo, se tivessemos uma coleção de posts e outra de usuários, onde cada post estaria relacionado com um usuário.
- Para isso, o model da coleção que desejamos criar uma relação precisa conter um campo de relação que vai armazenar o id para relacionar, e ainda uma referência a qual coleção aquele id faz referencia.

````javascript
const mongoose = require("../database");

const PostSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Post = mongoose.model("Post", PostSchema);

module.exports = Post;
````

- Ao criar um post, precisamos apenas passar o id do usuário dono daquele post.
- Para retornar o post com dados do usuário, podemos fazer um simples find na coleção usando o id do usuário, e ao final, usar a função `populate`, passando o campo de referencia, para que este campo seja populado com os valores armazenados na outra coleção.

````javascript
const express = require("express");
const Post = require("../models/post");

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    let post = await Post.create(req.body);
    res.send(post);
  } catch (err) {
    res
      .status(400)
      .send({ message: "Could not create a new post.", error: err });
  }
});

router.get("/all/:userId", async (req, res) => {
  try {
    const posts = await Post.find({ user: req.params.userId }).populate("user");
    res.send(posts);
  } catch (err) {
    res
      .status(400)
      .send({ message: "Could not find all user posts.", error: err });
  }
});

module.exports = router;
````

- Temos o seguinte objeto retornado:

````javascript
[
    {
        "_id": "5e550ef5e92bd46d72aedf4e",
        "text": "Esse é o texto do meu primeiro post",
        "user": {
            "_id": "5e550ea8e92bd46d72aedf4d",
            "name": "Caieu",
            "email": "caieu2@caiu.com",
            "createdAt": "2020-02-25T12:10:16.292Z",
            "__v": 0
        },
        "createdAt": "2020-02-25T12:11:33.926Z",
        "__v": 0
    }
]
````

## Encriptando a senha do usuário

- Para segurança, precisamos encriptar a senha do usuário antes de gravar no banco.
- Para isso, precisamos do pacote `bcryptjs` que possui uma função de hash.
- No model do usuário, vamos adicionar um `pre` que é chamado sempre antes de salvar algo na colecao. Ela será chamada antes que seja salvo as informações do usuário no banco, para que possamos encripitar a senha.

````javascript
UserSchema.pre("save", async function(next) {
  const hash = await bcrypt.hash(this.password, 10);
  this.password = hash;
  next();
});
````

## Gerando token de autenticação

- Para criar um token de autenticação, vamos precisar do pacote `jsonwebtoken`.
- Agora, vamos criar uma nova chamada `post` nas rotas de `auth`, chamda `/authenticate`.
- Nessa chamada, recebemos no corpo da requisicao o email e a senha do usuário.
- Primeiramente verificamos se existe um usuario com o email que foi passado.
- Depois é verificado por meio da funcao `bycrpt.compare` se a senha passada na requisicao é igual a senha encriptada que está salva no banco.
- Caso tudo seja confirmado, devemos criar um token usando o pacote `jsonwebtoken`, chamando a funcao `sign`, que recebe um objeto com um id, que pode ser o id do usuário, um MD5 SECRET unico, que foi colocado no arquvio `.env` e por ultimo um objeto com um `expiresIn`, dizendo em quanto tempo aquele token vai expirar.
- No final, retornamos um objeto com o user e o token gerado.

````javascript
router.post("/authenticate", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email }).select("+password");
    if (!user) return res.status(400).send({ message: "User not found." });
    if (!(await bcrypt.compare(password, user.password)))
      return res.status(400).send({ message: "Invalid password." });
    user.password = undefined;
    const token = jwt.sign({ id: user.id }, process.env.TOKEN_SECRET, {
      expiresIn: 86400
    });
    return res.send({ user, token });
  } catch (err) {
    res.status(400).send({ message: "Unable to authenticate.", error: err });
  }
});
````

## Verificando o token nas chamadas

- Queremos garantir que algumas chamadas só possam ser realizadas se o usuário estiver logado.
- Precisamos verificar se a chamada feita para o servidor possui o token de autenticação nos headers.
- Para isso, vamos criar um middleware, que é uma função que vai ser chamada sempre que determinada rota for chamada.
- Crie uma pasta chamada `middlewares` com um arquivo `auth.js`.
- Ela possui uma função exportada que recebe como parametro `req, res e next`.
- Dentro dessa funçao precisamos pegar o header `Authorization` e verificar se esse header está correto, como `Bearer` no começo e depois um token válido.
- Caso o header esteja correto, usamos a função `next()` para seguir o fluxo normal da rota.

````javascript
const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader)
    return res.status(401).send({ message: "Authorization not found" });

  const parts = authHeader.split(" ");

  if (!parts.length === 2)
    return res.status(401).send({ message: "Malformed Authorization" });

  const [scheme, token] = parts;

  if (!/^Bearer$/i.test(scheme))
    return res.status(401).send({ message: "Malformed Authorization" });

  jwt.verify(token, process.env.TOKEN_SECRET, (err, decoded) => {
    if (err) return res.status(401).send({ message: "Invalid token" });
    req.userId = decoded.id;
    return next();
  });
};
````

- Com o middleware criado, agora podemos usar na rota desejada.
- Vamos colocar na rota de `Post`.
- Para isso, em `routes/post.js`, importe o middleware, e use no router.

````javascript
const express = require("express");
const Post = require("../models/post");
const authMiddleware = require("../middlewares/auth");

const router = express.Router();
router.use(authMiddleware);
````

## Buscando no banco

- Para buscar por um post específicos no banco, vamos passar o id do post na própria rota, `/post/:id`.
- Para recuperar esse id do post, usarmos a variável `req.params.id`.

````javascript
router.get("/:id", async (req, res) => {
  try {
    const posts = await Post.findById(req.params.id);
    res.send(posts);
  } catch (err) {
    res.status(400).send({ message: "Could not find the post.", error: err });
  }
});
````

- Vamos adicionar um campo de tags nos posts.
- Caso queira buscar por posts com tags específicas, passamos essas tags na query da chamada separadas por virgula.
- Também podemos pesquisar por user, passando na query um `user` que seu valor é o id do user.
- Usamos o operador `$and` para garantir que os posts retornados venham com todos os parametros que foram passados na query.
- O operador `$in` busca dentro de um array se ele possui algum dos elementos que foram passados.

````javascript
router.get("/", async (req, res) => {
  try {
    let params = { $and: [] };
    if (req.query.text) params.$and.push({ text: `/${req.query.text}/i` });
    if (req.query.user) params.$and.push({ user: req.query.user });
    if (req.query.tags)
      params.$and.push({ tags: { $in: req.query.tags.split(",") } });
    const posts = await Post.find(params).populate("user");
    res.send(posts);
  } catch (err) {
    res
      .status(400)
      .send({ message: "Could not find all user posts.", error: err });
  }
});
````
