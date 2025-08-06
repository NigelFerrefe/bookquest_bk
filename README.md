# BookQuest API

REST API for managing books, authors, genres, and users, featuring JWT-based authentication and Cloudinary image uploads.

## Technologies Used

- Node.js + Express
- MongoDB + Mongoose
- Zod for data validation
- JWT for authentication
- Cloudinary for image management
- Custom middleware for authentication and error handling

---

## Installation

1. Clone the repository  
2. Run `npm install` to install dependencies  
3. Set environment variables in `.env`:  
    - `MONGODB_URI`  
    - `JWT_SECRET`  
    - `CLOUDINARY_CLOUD_NAME`  
    - `CLOUDINARY_API_KEY`  
    - `CLOUDINARY_API_SECRET`  
4. Run `npm start` to start the server

---

## Routes and Endpoints

### Auth (`/auth`)

- **POST /auth/signup**  
  Create a new user  
  Body: `{ email, password, name }`

- **POST /auth/login**  
  User login  
  Body: `{ email, password }`

- **POST /auth/logout**  
  Logout user 

---

### User (`/user`)

- **GET /user/:userId**  
  Get user profile (password excluded)  
  Header: `Authorization: Bearer <token>`

- **PUT /user/:userId**  
  Update user profile (admin role required)  
  Header: `Authorization: Bearer <token>`  
  Body: fields to update (email, name, role, etc.)

---

### Author (`/author`)

- **POST /author**  
  Create a new author  
  Header: `Authorization: Bearer <token>`  
  Body: `{ name, bio, ... }`

- **GET /author**  
  List all authors

- **PUT /author/:authorId**  
  Update author  
  Header: `Authorization: Bearer <token>`  
  Body: fields to update

- **DELETE /author/:authorId**  
  Delete author  
  Header: `Authorization: Bearer <token>`

---

### Genre (`/genre`)

- **POST /genre**  
  Create a new genre  
  Header: `Authorization: Bearer <token>`  
  Body: `{ name, description }`

- **GET /genre**  
  List all genres

- **PUT /genre/:genreId**  
  Update genre  
  Header: `Authorization: Bearer <token>`  
  Body: fields to update

- **DELETE /genre/:genreId**  
  Delete genre  
  Header: `Authorization: Bearer <token>`

---

### Book (`/book`)

- **POST /book**  
  Create a new book (supports Cloudinary image upload)  
  Header: `Authorization: Bearer <token>`  
  Body: `{ title, author, genre, description, price, isBought, isFavorite, imageUrl }`

- **GET /book/:bookId**  
  Get book details

- **PUT /book/:bookId**  
  Update book (supports image upload/update)  
  Header: `Authorization: Bearer <token>`  
  Body: fields to update

- **DELETE /book/:bookId**  
  Delete book  
  Header: `Authorization: Bearer <token>`

---

### Book Lists (`/books-lists`)

User book lists with pagination (10 items per page)

- **GET /books-lists/wishlist**  
  Get wishlist books  
  Query params: `?page=1`  
  Header: `Authorization: Bearer <token>`

- **GET /books-lists/favorites**  
  Get favorite books  
  Query params: `?page=1`  
  Header: `Authorization: Bearer <token>`

- **GET /books-lists/purchased**  
  Get purchased books  
  Query params: `?page=1`  
  Header: `Authorization: Bearer <token>`

---

## Validation

All inputs are validated with [Zod](https://github.com/colinhacks/zod), ensuring data integrity and type safety in the routes.

---

## Middleware

- **Auth middleware:** validates JWT tokens on protected routes  
- **Error handling:** centralized error management for clear responses

---

## Image Uploads

Book images are managed via Cloudinary. The `POST /book` and `PUT /book/:id` routes support uploads via `multer` and save the resulting image URL.

---

## Final Notes

- The API is designed for personal use with just two users, so the user system is simple.   
- Role control is basic, with middleware protecting admin routes.  
- Passwords are securely stored with bcrypt.

---

If you have any questions or want to contribute, feel free to open issues or pull requests.

Thank you for using BookQuest API! 📚🚀
