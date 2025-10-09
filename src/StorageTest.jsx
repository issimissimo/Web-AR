import { createSignal } from "solid-js"
import { useFirebase } from "@hooks/useFirebase"

export default function StorageTest() {
    const { storage, auth } = useFirebase()
    const [selectedFile, setSelectedFile] = createSignal(null)
    const [uploading, setUploading] = createSignal(false)
    const [progress, setProgress] = createSignal(0)
    const [uploadedURL, setUploadedURL] = createSignal(null)
    const [error, setError] = createSignal(null)

    const handleFileSelect = (event) => {
        const file = event.target.files[0]
        if (file) {
            setSelectedFile(file)
            setUploadedURL(null)
            setError(null)
            console.log(
                "File selezionato:",
                file.name,
                "Dimensione:",
                file.size,
                "Tipo:",
                file.type
            )
        }
    }

    const handleUpload = async () => {
        const file = selectedFile()
        if (!file) {
            setError("Nessun file selezionato")
            return
        }

        const user = auth.user()
        if (!user) {
            setError("Utente non autenticato")
            return
        }

        setUploading(true)
        setError(null)
        setProgress(0)

        try {
            // Crea un percorso unico usando timestamp
            const timestamp = Date.now()
            const fileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_") // Sanitizza il nome
            const path = `users/${user.uid}/test-uploads/${timestamp}_${fileName}`

            console.log("Inizio upload su percorso:", path)

            // Upload con monitoraggio progresso
            const url = await storage.uploadFileWithProgress(
                path,
                file,
                (prog) => {
                    setProgress(Math.round(prog))
                    console.log(`Progresso upload: ${Math.round(prog)}%`)
                },
                {
                    contentType: file.type,
                    customMetadata: {
                        uploadedBy: user.uid,
                        uploadedAt: new Date().toISOString(),
                        originalName: file.name,
                    },
                }
            )

            setUploadedURL(url)
            console.log("Upload completato! URL:", url)
        } catch (err) {
            console.error("Errore durante l'upload:", err)
            setError(err.message || "Errore durante l'upload")
        } finally {
            setUploading(false)
        }
    }

    const resetTest = () => {
        setSelectedFile(null)
        setUploadedURL(null)
        setError(null)
        setProgress(0)
    }

    return (
        <div
            style={{
                "max-width": "600px",
                margin: "20px auto",
                padding: "20px",
                "font-family": "system-ui, -apple-system, sans-serif",
            }}
        >
            <h2>Test Firebase Storage Upload</h2>

            {/* Input file - funziona su desktop, Android e iOS */}
            <div style={{ "margin-bottom": "20px" }}>
                <label
                    style={{
                        display: "block",
                        padding: "15px",
                        "background-color": "#4CAF50",
                        color: "white",
                        "text-align": "center",
                        "border-radius": "8px",
                        cursor: "pointer",
                        "font-weight": "bold",
                    }}
                >
                    {selectedFile() ? "📄 " + selectedFile().name : "📁 Seleziona File"}
                    <input
                        type="file"
                        onChange={handleFileSelect}
                        style={{ display: "none" }}
                        accept="*/*"
                    />
                </label>
            </div>

            {/* Info file selezionato */}
            {selectedFile() && (
                <div
                    style={{
                        padding: "15px",
                        "background-color": "#f5f5f5",
                        "border-radius": "8px",
                        "margin-bottom": "20px",
                    }}
                >
                    <p>
                        <strong>Nome:</strong> {selectedFile().name}
                    </p>
                    <p>
                        <strong>Dimensione:</strong>{" "}
                        {(selectedFile().size / 1024 / 1024).toFixed(2)} MB
                    </p>
                    <p>
                        <strong>Tipo:</strong> {selectedFile().type || "Non specificato"}
                    </p>
                </div>
            )}

            {/* Pulsante upload */}
            {selectedFile() && !uploadedURL() && (
                <button
                    onClick={handleUpload}
                    disabled={uploading()}
                    style={{
                        width: "100%",
                        padding: "15px",
                        "background-color": uploading() ? "#ccc" : "#2196F3",
                        color: "white",
                        border: "none",
                        "border-radius": "8px",
                        "font-size": "16px",
                        "font-weight": "bold",
                        cursor: uploading() ? "not-allowed" : "pointer",
                        "margin-bottom": "20px",
                    }}
                >
                    {uploading() ? "⏳ Caricamento..." : "⬆️ Carica File"}
                </button>
            )}

            {/* Barra progresso */}
            {uploading() && (
                <div style={{ "margin-bottom": "20px" }}>
                    <div
                        style={{
                            width: "100%",
                            height: "30px",
                            "background-color": "#e0e0e0",
                            "border-radius": "15px",
                            overflow: "hidden",
                        }}
                    >
                        <div
                            style={{
                                width: `${progress()}%`,
                                height: "100%",
                                "background-color": "#4CAF50",
                                transition: "width 0.3s ease",
                                display: "flex",
                                "align-items": "center",
                                "justify-content": "center",
                                color: "white",
                                "font-weight": "bold",
                            }}
                        >
                            {progress()}%
                        </div>
                    </div>
                </div>
            )}

            {/* Messaggio errore */}
            {error() && (
                <div
                    style={{
                        padding: "15px",
                        "background-color": "#ffebee",
                        color: "#c62828",
                        "border-radius": "8px",
                        "margin-bottom": "20px",
                        "border-left": "4px solid #c62828",
                    }}
                >
                    ❌ {error()}
                </div>
            )}

            {/* Successo upload */}
            {uploadedURL() && (
                <div
                    style={{
                        padding: "20px",
                        "background-color": "#e8f5e9",
                        "border-radius": "8px",
                        "border-left": "4px solid #4CAF50",
                    }}
                >
                    <h3 style={{ color: "#2e7d32", "margin-top": "0" }}>✅ Upload Completato!</h3>
                    <p>
                        <strong>URL:</strong>
                    </p>
                    <div
                        style={{
                            padding: "10px",
                            "background-color": "white",
                            "border-radius": "4px",
                            "word-break": "break-all",
                            "font-family": "monospace",
                            "font-size": "12px",
                            "margin-bottom": "15px",
                        }}
                    >
                        {uploadedURL()}
                    </div>

                    {/* Mostra anteprima se è un'immagine */}
                    {selectedFile() && selectedFile().type.startsWith("image/") && (
                        <div style={{ "margin-top": "15px" }}>
                            <p>
                                <strong>Anteprima:</strong>
                            </p>
                            <img
                                src={uploadedURL()}
                                alt="Uploaded file"
                                style={{
                                    "max-width": "100%",
                                    "border-radius": "8px",
                                    border: "2px solid #4CAF50",
                                }}
                            />
                        </div>
                    )}

                    <button
                        onClick={resetTest}
                        style={{
                            "margin-top": "15px",
                            padding: "10px 20px",
                            "background-color": "#4CAF50",
                            color: "white",
                            border: "none",
                            "border-radius": "6px",
                            cursor: "pointer",
                            "font-weight": "bold",
                        }}
                    >
                        🔄 Carica un altro file
                    </button>
                </div>
            )}

            {/* Info utente */}
            <div
                style={{
                    "margin-top": "30px",
                    padding: "15px",
                    "background-color": "#f5f5f5",
                    "border-radius": "8px",
                    "font-size": "14px",
                }}
            >
                <p>
                    <strong>Utente:</strong> {auth.user()?.uid || "Non autenticato"}
                </p>
                <p>
                    <strong>Email:</strong>{" "}
                    {auth.user()?.email || auth.user()?.isAnonymous ? "Anonimo" : "N/A"}
                </p>
            </div>
        </div>
    )
}
