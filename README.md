# PETUNJUK WAKK

## 1. Menggunakan app.get()

Metode app.get() digunakan untuk mendefinisikan route yang menangani permintaan GET.

```javascript
app.get('/fitur', (req, res) => {
  res.send('Hello, World!');
});
```

Parameter:

req: Objek permintaan yang berisi data tentang permintaan yang diterima.

res: Objek respons yang digunakan untuk mengirimkan respons kembali ke klien.


## 2. Menggunakan res.send()

Metode res.send() digunakan untuk mengirimkan respons ke klien. Ini bisa berupa string, objek, array, atau buffer.

```javascript
app.get('/fitur', (req, res) => {
  res.send({ message: 'Hello, JSON!' });
});
```

## 3. Menggunakan req.query

req.query digunakan untuk mengakses parameter query string dari URL.

```javascript
app.get('/fitur', (req, res) => {
  const text = req.query.text || 'World';
  res.send(`Hello, ${text}!`);
});
```

Contoh URL: /fitur?text=John

## 4. Menggunakan req.params

req.params digunakan untuk mengakses parameter dari URL yang ditentukan dalam route.

```javascript
app.get('/users/:id', (req, res) => {
  const userId = req.params.id;
  res.send(`User ID: ${userId}`);
});
```

Contoh URL: /users/123

## 5. Menggunakan Middleware

Middleware adalah fungsi yang memiliki akses ke objek permintaan dan respons.

```javascript
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});
```

## Contoh Lengkap

Berikut adalah contoh api lengkap:

```javascript
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

app.get('/', (req, res) => {
  res.send('Hello, World!');
});

app.get('/fitur', (req, res) => {
  const text = req.query.text || 'World';
  res.send(`Hello, ${text}!`);
});

app.get('/users/:id', (req, res) => {
  const userId = req.params.id;
  res.send(`User ID: ${userId}`);
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
```

## Gak paham?

tanya chat gpt wak, sekalian belajar
api ini itu kek sc case, gampang kalo udah paham

contoh: https://home.vreden.my.id

web full: https://api.vreden.my.id

bocah esdehh nihh bos, modal copas and gpt🗿