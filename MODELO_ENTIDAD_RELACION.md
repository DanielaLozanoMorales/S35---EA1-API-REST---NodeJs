# Modelo entidad–relación

La relación entre las tablas se expresa en Mermaid. Puede previsualizarse en GitHub o en un editor compatible.

```mermaid
erDiagram
    GENEROS ||--o{ MEDIA : "clasifica"
    DIRECTORES ||--o{ MEDIA : "dirige"
    PRODUCTORAS ||--o{ MEDIA : "produce"
    TIPOS ||--o{ MEDIA : "identifica"

    GENEROS {
        int id PK
        string nombre UK
        string estado
        string descripcion
        datetime fecha_creacion
        datetime fecha_actualizacion
    }
    DIRECTORES {
        int id PK
        string nombres
        string estado
        datetime fecha_creacion
        datetime fecha_actualizacion
    }
    PRODUCTORAS {
        int id PK
        string nombre UK
        string estado
        string slogan
        string descripcion
        datetime fecha_creacion
        datetime fecha_actualizacion
    }
    TIPOS {
        int id PK
        string nombre UK
        string descripcion
        datetime fecha_creacion
        datetime fecha_actualizacion
    }
    MEDIA {
        int id PK
        string serial UK
        string titulo
        string sinopsis
        string url_pelicula UK
        string portada
        int anio_estreno
        int genero_id FK
        int director_id FK
        int productora_id FK
        int tipo_id FK
        datetime fecha_creacion
        datetime fecha_actualizacion
    }
```

**Notas:** Una producción tiene exactamente un género, un director, una productora y un tipo; cada catálogo puede ser reutilizado por múltiples producciones. `UK` significa valor único.
