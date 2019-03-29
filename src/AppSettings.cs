namespace demo_storage_valet_key {
    class Storage {
        public string ConnectionString {get; set;}
        public string ContainerName {get; set;}
    }
    class AppSettings {
        public Storage Storage {get; set;}
    }
}