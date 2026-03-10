export interface Searchable {
  resolve(id: number): Promise<Suggestion>

  search(query: string): Promise<Suggestion[]>

  searchAndListing(query: string | null): never
}
