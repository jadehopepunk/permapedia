module TaxonomyHelper
  def species_taxon(taxon)
    content_tag(:span, :class => 'species_name') do
      html_join(
        taxon_part(taxon, 'genus_name'),
        taxon_part(taxon, 'species_name')
      )
    end
  end
  
  def taxon_part(taxon, key)
    content_tag(:span, taxon.send(key), :class => key)
  end
end