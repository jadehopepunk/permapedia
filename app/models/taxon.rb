class Taxon < ActiveRecord::Base
  validates :genus_name, :species_name, :presence => true
  
  def name
    [genus_name, species_name].reject(&:blank?).join(' ')
  end
end
