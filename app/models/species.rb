class Species < ActiveRecord::Base
  def name
    "Species #{id}" unless new_record?
  end
end
