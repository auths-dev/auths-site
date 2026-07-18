pub fn read_spend_log(path: &Path) -> std::io::Result<Vec<SpendLogRecord>> {
    let raw = std::fs::read_to_string(path)?; // single file only
    unimplemented!()
}
