Permapedia::Application.routes.draw do
  resources :plants, :taxa

  match 'home', :to => 'home#index'
  root :to => 'home#index'
end
