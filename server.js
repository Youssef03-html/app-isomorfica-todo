import express from 'express';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor en marcha en el puerto ${PORT}`);
});

app.use(express.static(join(__dirname, 'public')));

// Configuración lowdb
const dbFile = join(__dirname, 'db.json');
const adapter = new JSONFile(dbFile);
const db = new Low(adapter, { tasks: [] });

// Middleware
app.use(express.json());

// Inicializar BD
async function initDB() {
    await db.read();
    db.data ||= { tasks: [] };
    await db.write();
    }

await initDB();

// Ruta principal
app.get('/', (req, res) => {
    res.sendFile(join(__dirname, 'index.html'));
});

// Arrancar servidor
app.listen(PORT, () => {
    console.log(`Servidor en marcha en http://localhost:${PORT}`);
});

// Obtener todas las tareas
app.get('/api/tasks', async (req, res) => {
    await db.read();
    res.json(db.data.tasks);
});

// Añadir una nueva tarea
app.post('/api/tasks', async (req, res) => {
    const { title } = req.body;

    if (!title) {
        return res.status(400).json({ error: 'El título es obligatorio' });
    }

    const newTask = {
        id: Date.now(),
        title,
        completed: false
    };

    await db.read();
    db.data.tasks.push(newTask);
    await db.write();

    res.status(201).json(newTask);
});

// Actualizar una tarea (título y/o estado)
app.put('/api/tasks/:id', async (req, res) => {
    const id = parseInt(req.params.id);
    const { title, completed } = req.body;

    await db.read();
    const task = db.data.tasks.find(t => t.id === id);

    if (!task) {
        return res.status(404).json({ error: 'Tarea no encontrada' });
    }

    // Actualizar campos solo si vienen en el body
    if (title !== undefined) {
        task.title = title;
    }

    if (completed !== undefined) {
        task.completed = completed;
    }

    await db.write();
    res.json(task);
});

// Eliminar una tarea
app.delete('/api/tasks/:id', async (req, res) => {
  const id = Number(req.params.id); // 🔑 asegurar número

  await db.read();

  const initialLength = db.data.tasks.length;

  db.data.tasks = db.data.tasks.filter(task => task.id !== id);

  if (db.data.tasks.length === initialLength) {
    return res.status(404).json({ error: 'Tarea no encontrada' });
  }

  await db.write();
  res.status(200).json({ success: true });
});



