import { AudioConverter } from './components/AudioConverter'
import './App.css'

function App() {
  return (
    <div className="app">
      <header className="header">
        <h1>セキュア オーディオ変換ツール(Media to mp3)</h1>
        <p>クライアントサイドで動作するオーディオ変換ツール</p>
        <div className="privacy-note">
          すべての変換処理はブラウザ内で完結します。
          ファイルはサーバーに送信されず、安全にご利用いただけます。
        </div>
      </header>
      <main>
        <AudioConverter />
      </main>
      <footer className="footer">
        <a href="https://frees.jp" target="_blank" rel="noopener noreferrer">frees.jp</a>
      </footer>
    </div>
  )
}

export default App
