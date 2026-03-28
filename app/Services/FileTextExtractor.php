<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;

class FileTextExtractor
{
    public function extract(UploadedFile $file): string
    {
        $extension = strtolower($file->getClientOriginalExtension());

        $text = match ($extension) {
            'txt', 'md' => file_get_contents($file->getRealPath()),
            'pdf' => $this->extractFromPdf($file),
            default => '',
        };

        // Truncate to ~8000 chars for Groq context window
        return mb_substr(trim($text), 0, 8000);
    }

    private function extractFromPdf(UploadedFile $file): string
    {
        $parser = new \Smalot\PdfParser\Parser();
        $pdf = $parser->parseFile($file->getRealPath());
        return $pdf->getText();
    }
}
