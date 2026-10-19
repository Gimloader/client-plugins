export default function LoadingScreen() {
    return (
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", height: "250px" }}>
            <h2 style={{ fontSize: "2rem", fontWeight: "bold" }}>
                GamemodeLinks: Loading Game
            </h2>
            <p style={{ fontSize: "1.2rem", marginTop: "1rem" }}>
                This should only take a moment...
            </p>
        </div>
    );
}
