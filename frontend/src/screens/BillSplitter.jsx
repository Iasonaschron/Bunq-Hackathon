import { useState, useRef } from "react"
import { useNavigate } from "react-router-dom"
import "./BillSplitter.css"

export default function BillSplitter() {
  const navigate = useNavigate()
  const fileRef = useRef()
  const [image, setImage] = useState(null)
  const [instruction, setInstruction] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  function handleFile(e) {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => {
      const dataUrl = reader.result
      setImage({
        base64: dataUrl.split(",")[1],
        mediaType: dataUrl.split(";")[0].split(":")[1],
        url: dataUrl,
      })
    }
  }

  async function handleSubmit() {
    if (!image || !instruction.trim()) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("http://localhost:8000/split-bill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image_base64: image.base64,
          media_type: image.mediaType,
          instruction: instruction.trim(),
        }),
      })
      if (!res.ok) {
        const text = await res.text()
        throw new Error(text)
      }
      setResult(await res.json())
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function reset() {
    setImage(null)
    setInstruction("")
    setResult(null)
    setError(null)
  }

  return (
    <div className="bs-screen">
      <header className="bs-header">
        <button className="bs-back" onClick={() => navigate("/group")} aria-label="Back">
          ‹
        </button>
        <span className="bs-title">Split Bill</span>
      </header>

      <div className="bs-body">
        {result ? (
          <>
            <div className="bs-success">✅ Payment requests sent!</div>

            <span className="bs-section-title">Items on receipt</span>
            <div className="bs-card">
              {result.items.map((item, i) => (
                <div key={i} className="bs-item-row">
                  <span className="bs-item-name">{item.name}</span>
                  <span className="bs-item-price">€{Number(item.price).toFixed(2)}</span>
                </div>
              ))}
            </div>

            <span className="bs-section-title">Who owes what</span>
            {result.splits.map((split, i) => (
              <div key={i} className="bs-split-card">
                <div className="bs-split-top">
                  <span className="bs-split-name">{split.person}</span>
                  <span className="bs-split-amount">€{Number(split.amount).toFixed(2)}</span>
                </div>
                <span className="bs-split-reason">{split.reason}</span>
              </div>
            ))}

            <button className="bs-secondary-btn" onClick={reset}>
              Split another
            </button>
          </>
        ) : (
          <>
            <div
              className={["bs-upload", image ? "bs-upload--filled" : ""].join(" ")}
              onClick={() => fileRef.current.click()}
            >
              {image ? (
                <img className="bs-preview" src={image.url} alt="receipt preview" />
              ) : (
                <>
                  <span className="bs-upload-icon">📸</span>
                  <span className="bs-upload-label">Upload Receipt</span>
                  <span className="bs-upload-sub">Tap to choose a photo</span>
                </>
              )}
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={handleFile}
              />
            </div>

            <textarea
              className="bs-textarea"
              rows={3}
              placeholder="e.g. Marco and Sofia had the steak, Jan had the pasta"
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              disabled={loading}
            />

            {error && <div className="bs-error">{error}</div>}

            <button
              className="bs-submit-btn"
              onClick={handleSubmit}
              disabled={!image || !instruction.trim() || loading}
            >
              {loading ? "🧠 Claude is reading your receipt..." : "Split & Request 💸"}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
