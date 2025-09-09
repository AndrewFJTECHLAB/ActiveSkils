import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Upload, FileText, Eye, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { Document } from "../../types/type";
import { saveDocument } from "../../supabase/uploadDocument";
import { extractDocumentData } from "@/api/GET/routes";
import { DOCUMENT_TYPES, STATUS_COLORS } from "@/Data/data";
import { useAuth } from "@/context/AuthContext";

export default function Documents() {
  const { user, session, profile, isLoading } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [documentType, setDocumentType] = useState("");
  const [viewingMarkdown, setViewingMarkdown] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      fetchDocuments();
    }
  }, [user]);

  const fetchDocuments = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("documents")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error("Error fetching documents:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les documents",
        variant: "destructive",
      });
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type !== "application/pdf") {
        toast({
          title: "Erreur",
          description: "Seuls les fichiers PDF sont acceptés",
          variant: "destructive",
        });
        return;
      }
      setSelectedFile(file);
      if (!title) {
        setTitle(file.name.replace(".pdf", ""));
      }
    }
  };

  const uploadDocument = async () => {
    if (!selectedFile || !title || !documentType || !user) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const fileName = `${user.id}/${Date.now()}-${selectedFile.name}`;

      // Upload file to storage
      const { error: uploadError } = await supabase.storage
        .from("documents")
        .upload(fileName, selectedFile);

      if (uploadError) throw uploadError;

      // Create document record
      await saveDocument({
        userId: user.id,
        documentTitle: title,
        documentType: documentType,
        fileName: selectedFile.name,
        filePath: fileName,
        fileSize: selectedFile.size,
      });

      toast({
        title: "Succès",
        description: "Document uploadé avec succès",
      });

      // Reset form
      setSelectedFile(null);
      setTitle("");
      setDocumentType("");
      const fileInput = document.getElementById(
        "file-input"
      ) as HTMLInputElement;
      if (fileInput) fileInput.value = "";

      // Refresh documents
      fetchDocuments();

      // Process PDF extraction
      extractDocumentData(fileName);
    } catch (error) {
      console.error("Error uploading document:", error);
      toast({
        title: "Erreur",
        description: "Erreur lors de l'upload du document",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteDocument = async (document: Document) => {
    if (!user) return;

    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from("documents")
        .remove([document.file_path]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from("documents")
        .delete()
        .eq("id", document.id)
        .eq("user_id", user.id);

      if (dbError) throw dbError;

      toast({
        title: "Succès",
        description: "Document supprimé avec succès",
      });

      fetchDocuments();
    } catch (error) {
      console.error("Error deleting document:", error);
      toast({
        title: "Erreur",
        description: "Erreur lors de la suppression",
        variant: "destructive",
      });
    }
  };

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        toast({
          title: "Erreur",
          description: "Impossible de se déconnecter.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Déconnexion réussie",
          description: "Vous avez été déconnecté.",
        });
        window.location.href = "https://activskills.com/";
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur inattendue s'est produite.",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const color =
      STATUS_COLORS[status as keyof typeof STATUS_COLORS] || "bg-gray-500";
    const labels = {
      pending: "En attente",
      processing: "En cours",
      completed: "Terminé",
      error: "Erreur",
    };

    return (
      <Badge className={`${color} text-white`}>
        {labels[status as keyof typeof labels] || status}
      </Badge>
    );
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to auth
  }

  const displayName =
    profile?.first_name && profile?.last_name
      ? `${profile.first_name} ${profile.last_name}`
      : user.email;

  return (
    <div className="min-h-screen bg-background">
      {/* Header avec logo et navigation */}
      <header className="border-b border-border px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-3">
              <img
                src="/lovable-uploads/7fc3df79-912a-48f7-af7c-c4852fe05723.png"
                alt="ActivSkills Logo"
                className="h-8 w-8"
              />
              <h1 className="text-2xl font-bold text-primary">ActivSkills</h1>
            </div>
            <nav className="flex items-center space-x-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/app")}
              >
                Dashboard
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/documents")}
                className="bg-accent text-accent-foreground"
              >
                Documents
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/app")}
              >
                Profil
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/app")}
              >
                Portfolio
              </Button>
            </nav>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm text-foreground">{displayName}</span>
            </div>
            <Button variant="outline" onClick={handleSignOut}>
              Déconnexion
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto p-6 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Gestion des Documents</h1>
          <p className="text-muted-foreground">
            Uploadez et gérez vos documents pour l'analyse de compétences
          </p>
        </div>

        {/* Upload Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Ajouter un nouveau document
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title">Titre du document</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Entrez le titre du document"
                />
              </div>
              <div>
                <Label htmlFor="document-type">Type de document</Label>
                <Select value={documentType} onValueChange={setDocumentType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez le type" />
                  </SelectTrigger>
                  <SelectContent>
                    {DOCUMENT_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="file-input">Fichier PDF</Label>
              <div className="flex items-center gap-3">
                <input
                  id="file-input"
                  type="file"
                  accept=".pdf"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById("file-input")?.click()}
                  className="flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  Choisir un fichier
                </Button>
                <span className="text-sm text-muted-foreground flex-1">
                  {selectedFile
                    ? `${selectedFile.name} (${formatFileSize(selectedFile.size)})`
                    : "Aucun fichier sélectionné"}
                </span>
              </div>
            </div>

            <Button
              onClick={uploadDocument}
              disabled={loading || !selectedFile || !title || !documentType}
              className="w-full md:w-auto"
            >
              {loading ? "Upload en cours..." : "Uploader le document"}
            </Button>
          </CardContent>
        </Card>

        {/* Documents List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Mes Documents ({documents.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {documents.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Aucun document uploadé pour le moment
              </p>
            ) : (
              <div className="space-y-4">
                {documents.map((document) => (
                  <div
                    key={document.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-medium">{document.title}</h3>
                          {getStatusBadge(document.status)}
                          <Badge variant="outline">
                            {
                              DOCUMENT_TYPES.find(
                                (t) => t.value === document.document_type
                              )?.label
                            }
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground space-y-1">
                          <p>
                            Fichier: {document.file_name} (
                            {formatFileSize(document.file_size)})
                          </p>
                          <p>
                            Créé le:{" "}
                            {new Date(document.created_at).toLocaleDateString(
                              "fr-FR"
                            )}
                          </p>
                          {document.extraction_error && (
                            <p className="text-red-500">
                              Erreur: {document.extraction_error}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {document.markdown_content && (
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                setViewingMarkdown(document.markdown_content)
                              }
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
                            <DialogHeader>
                              <DialogTitle>
                                Contenu extrait (brut) - {document.title}
                              </DialogTitle>
                            </DialogHeader>
                            <div className="mt-4">
                              <div className="whitespace-pre-wrap font-mono text-sm border rounded p-4 bg-muted/50 max-h-[60vh] overflow-y-auto">
                                {(() => {
                                  try {
                                    const content =
                                      document.markdown_content || "";
                                    // Try to parse as JSON first (LlamaIndex format)
                                    const parsed = JSON.parse(content);
                                    return parsed.markdown || content;
                                  } catch {
                                    // If not JSON, return content as-is
                                    return (
                                      document.markdown_content ||
                                      "Aucun contenu disponible"
                                    );
                                  }
                                })()}
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      )}

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteDocument(document)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}